"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Frequency } from "@/lib/supabase/types";

export interface CreateSanInput {
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  startDate: string;
  totalTurns: number;
}

export async function createSan(input: CreateSanInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("sans")
    .insert({
      name: input.name,
      contribution_amount: input.contributionAmount,
      frequency: input.frequency,
      start_date: input.startDate,
      total_turns: input.totalTurns,
      created_by: user.id,
      announcement: "",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el San");
  }

  revalidatePath("/admin/users");
  redirect(`/admin/manage/${data.id}`);
}

export interface ReorderItem {
  id: string;
  turnNumber: number;
  payoutDate: string;
}

export async function reorderTurns(sanId: string, members: ReorderItem[]) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("reorder_san_members", {
    p_san_id: sanId,
    p_members: members.map((m) => ({
      id: m.id,
      turn_number: m.turnNumber,
      payout_date: m.payoutDate,
    })),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/manage/${sanId}`);
  revalidatePath("/");
}

export async function updateAnnouncement(sanId: string, announcement: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sans")
    .update({ announcement })
    .eq("id", sanId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/manage/${sanId}`);
  revalidatePath("/");
}
