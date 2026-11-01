"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAnnouncementPush } from "@/lib/push";
import type { Frequency } from "@/lib/supabase/types";

export interface CreateSanInput {
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  startDate: string;
  totalTurns: number;
}

export async function createSan(input: CreateSanInput) {
  if (!input.name.trim()) {
    throw new Error("El nombre del San es obligatorio");
  }
  if (!Number.isFinite(input.contributionAmount) || input.contributionAmount <= 0) {
    throw new Error("El monto por periodo debe ser mayor a 0");
  }
  if (!Number.isInteger(input.totalTurns) || input.totalTurns <= 0) {
    throw new Error("El total de turnos debe ser un número entero mayor a 0");
  }

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

export async function joinSanAsAdmin(
  sanId: string,
  turnNumber: number,
  payoutDate: string,
) {
  if (!Number.isInteger(turnNumber) || turnNumber <= 0) {
    throw new Error("Elige un turno válido");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // RLS (`san_members_insert_admin`) ya exige que el llamante sea el admin
  // dueño del San; aquí solo se vincula su propio perfil como participante.
  const { error } = await supabase.from("san_members").insert({
    san_id: sanId,
    user_id: user.id,
    turn_number: turnNumber,
    payout_date: payoutDate,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ese turno ya está ocupado o ya participas en este San");
    }
    throw new Error(error.message);
  }

  revalidatePath(`/admin/manage/${sanId}`);
  revalidatePath("/");
}

export async function setPayoutReceived(
  sanId: string,
  memberId: string,
  received: boolean,
) {
  const supabase = await createClient();

  // RLS (`san_members_update_admin`) exige que el llamante sea el admin
  // dueño del San.
  const { error } = await supabase
    .from("san_members")
    .update({ payout_received: received })
    .eq("id", memberId)
    .eq("san_id", sanId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/manage/${sanId}`);
  revalidatePath("/");
}

export async function updateAnnouncement(sanId: string, announcement: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sans")
    .update({ announcement })
    .eq("id", sanId)
    .select("name")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/manage/${sanId}`);
  revalidatePath("/");

  // `after()` corre esto una vez enviada la respuesta, pero mantiene vivo
  // el runtime hasta que termine (en vez de un fire-and-forget que Vercel
  // podría cortar al cerrar la función serverless).
  after(async () => {
    try {
      await sendAnnouncementPush(sanId, data?.name ?? "SanApp", announcement);
    } catch (err) {
      console.error("Error enviando push de aviso:", err);
    }
  });
}
