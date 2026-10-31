"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPaymentAbono(
  sanId: string,
  userId: string,
  roundNumber: number,
  amountToAdd: number,
) {
  if (amountToAdd <= 0) {
    throw new Error("El monto a abonar debe ser mayor a 0");
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
  const newTotal = currentTotal + amountToAdd;
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
