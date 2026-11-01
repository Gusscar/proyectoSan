"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function addPaymentAbono(
  sanId: string,
  userId: string,
  roundNumber: number,
  amountToAdd: number,
) {
  if (!Number.isFinite(amountToAdd) || amountToAdd <= 0) {
    throw new Error("El monto a abonar debe ser un número mayor a 0");
  }

  const supabase = await createClient();

  const { data: san, error: sanError } = await supabase
    .from("sans")
    .select("contribution_amount")
    .eq("id", sanId)
    .single();

  if (sanError || !san) throw new Error("San no encontrado");

  const { data: currentPayment } = await supabase
    .from("payments")
    .select("amount_paid")
    .eq("san_id", sanId)
    .eq("user_id", userId)
    .eq("round_number", roundNumber)
    .maybeSingle();

  const currentTotal = currentPayment?.amount_paid ?? 0;
  const newTotal = round2(currentTotal + amountToAdd);

  if (newTotal > san.contribution_amount) {
    const remaining = Math.max(round2(san.contribution_amount - currentTotal), 0);
    throw new Error(
      `El abono excede lo pendiente del periodo: solo faltan ${formatCurrency(remaining)}.`,
    );
  }

  const isComplete = newTotal >= san.contribution_amount;

  const { error } = await supabase.from("payments").upsert(
    {
      san_id: sanId,
      user_id: userId,
      round_number: roundNumber,
      amount_paid: newTotal,
      is_complete: isComplete,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "san_id,user_id,round_number" },
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/manage/${sanId}`);
  revalidatePath("/");

  return { success: true, newTotal, isComplete };
}

/** Corrige el total abonado de un periodo a un valor exacto (p. ej. si se registró mal). */
export async function correctPaymentAmount(
  sanId: string,
  userId: string,
  roundNumber: number,
  newAmount: number,
) {
  if (!Number.isFinite(newAmount) || newAmount < 0) {
    throw new Error("El monto corregido debe ser un número mayor o igual a 0");
  }

  const supabase = await createClient();

  const { data: san, error: sanError } = await supabase
    .from("sans")
    .select("contribution_amount")
    .eq("id", sanId)
    .single();

  if (sanError || !san) throw new Error("San no encontrado");

  const rounded = round2(newAmount);

  if (rounded > san.contribution_amount) {
    throw new Error(
      `El monto no puede superar lo que corresponde al periodo (${formatCurrency(san.contribution_amount)}).`,
    );
  }

  const isComplete = rounded >= san.contribution_amount && rounded > 0;

  const { error } = await supabase.from("payments").upsert(
    {
      san_id: sanId,
      user_id: userId,
      round_number: roundNumber,
      amount_paid: rounded,
      is_complete: isComplete,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "san_id,user_id,round_number" },
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/manage/${sanId}`);
  revalidatePath("/");

  return { success: true, newTotal: rounded, isComplete };
}
