import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/utils";

interface ResetPasswordBody {
  userId: string;
  sanId: string;
}

export async function POST(req: Request) {
  // Mismo patrón de defensa en profundidad que create-user: el llamante
  // debe estar autenticado, ser admin, y ser dueño del San al que
  // pertenece el usuario cuya clave se va a restablecer.
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

  const body = (await req.json()) as Partial<ResetPasswordBody>;
  const { userId, sanId } = body;

  if (!userId || !sanId) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
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

  const { data: member } = await supabase
    .from("san_members")
    .select("id")
    .eq("san_id", sanId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { error: "Ese usuario no pertenece a este San" },
      { status: 404 },
    );
  }

  const adminClient = createAdminClient();
  const newPassword = generateTempPassword();

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    userId,
    { password: newPassword },
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const { error: credentialError } = await adminClient
    .from("member_credentials")
    .upsert(
      {
        san_id: sanId,
        user_id: userId,
        temp_password: newPassword,
      },
      { onConflict: "san_id,user_id" },
    );

  if (credentialError) {
    return NextResponse.json(
      { error: credentialError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, tempPassword: newPassword });
}
