import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateTempPassword,
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from "@/lib/utils";

interface CreateUserBody {
  username: string;
  fullName: string;
  phone?: string;
  sanId: string;
  /** Uno o más turnos a asignar de una vez (p. ej. si aporta por partida doble). */
  turnNumbers: number[];
  /** Mismo orden/longitud que `turnNumbers`. */
  payoutDates: string[];
}

export async function POST(req: Request) {
  // 1. El llamante debe estar autenticado y ser admin del San indicado.
  //    (Defensa en profundidad: RLS ya protege las tablas, pero esta ruta
  //    usa el cliente con Service Role, que bypasa RLS por completo.)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as Partial<CreateUserBody>;
  const { username, fullName, phone, sanId, turnNumbers, payoutDates } = body;

  if (
    !username ||
    !fullName ||
    !sanId ||
    !turnNumbers?.length ||
    !payoutDates?.length ||
    turnNumbers.length !== payoutDates.length
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  if (!isValidUsername(username)) {
    return NextResponse.json(
      {
        error:
          "El usuario debe tener 3-30 caracteres: letras, números, puntos, guiones o guion bajo.",
      },
      { status: 400 },
    );
  }

  const { data: san } = await supabase
    .from("sans")
    .select("id")
    .eq("id", sanId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!san) {
    return NextResponse.json({ error: "San no encontrado" }, { status: 404 });
  }

  const adminClient = createAdminClient();
  const tempPassword = generateTempPassword();
  const cleanUsername = normalizeUsername(username);
  const syntheticEmail = usernameToEmail(cleanUsername);

  // 2. Crear usuario en Supabase Auth con contraseña temporal aleatoria.
  //    Supabase exige un correo; generamos uno sintético a partir del
  //    usuario para no pedirle correo real al participante.
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: cleanUsername,
        phone: phone ?? null,
        role: "member",
      },
    });

  if (authError || !authData.user) {
    const message = authError?.message ?? "";
    const isDuplicate =
      message.toLowerCase().includes("already") ||
      message.toLowerCase().includes("registered");
    return NextResponse.json(
      {
        error: isDuplicate
          ? "Ese nombre de usuario ya está en uso."
          : message || "No se pudo crear el usuario",
      },
      { status: 400 },
    );
  }

  const userId = authData.user.id;

  // El perfil se crea solo vía trigger `on_auth_user_created`.

  // 3. Vincular al San con su(s) turno(s). Un solo insert con varias filas
  //    es atómico: si un turno ya fue tomado por otro admin justo ahora,
  //    la constraint unique(san_id,turn_number) hace fallar TODO el insert,
  //    sin dejar turnos a medio asignar.
  const { error: memberError } = await adminClient.from("san_members").insert(
    turnNumbers.map((turnNumber, i) => ({
      san_id: sanId,
      user_id: userId,
      turn_number: turnNumber,
      payout_date: payoutDates[i],
    })),
  );

  if (memberError) {
    await adminClient.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  // 4. Guardar la credencial temporal para que el admin la consulte luego.
  const { error: credentialError } = await adminClient
    .from("member_credentials")
    .insert({
      san_id: sanId,
      user_id: userId,
      username: cleanUsername,
      temp_password: tempPassword,
    });

  if (credentialError) {
    return NextResponse.json(
      { error: credentialError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    userId,
    username: cleanUsername,
    tempPassword,
  });
}
