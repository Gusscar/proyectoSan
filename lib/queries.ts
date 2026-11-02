import type { SupabaseClient } from "@supabase/supabase-js";
import type { Payment, Profile, San, SanMember, TransparencyRow } from "./supabase/types";
import { getPaymentStatus } from "./utils";

export interface MemberPaymentHistory {
  member: SanMember;
  profile: Profile;
  paymentsByRound: Map<number, Payment>;
}

export async function getPaymentsHistory(
  supabase: SupabaseClient,
  sanId: string,
): Promise<MemberPaymentHistory[]> {
  const [{ data: members }, { data: payments }] = await Promise.all([
    supabase
      .from("san_members")
      .select("*")
      .eq("san_id", sanId)
      .returns<SanMember[]>(),
    supabase
      .from("payments")
      .select("*")
      .eq("san_id", sanId)
      .returns<Payment[]>(),
  ]);

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds)
    .returns<Profile[]>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members
    .map((member) => {
      const profile = profileMap.get(member.user_id);
      if (!profile) return null;
      const paymentsByRound = new Map<number, Payment>();
      for (const payment of payments ?? []) {
        if (payment.san_member_id === member.id) {
          paymentsByRound.set(payment.round_number, payment);
        }
      }
      return { member, profile, paymentsByRound };
    })
    .filter((row): row is MemberPaymentHistory => row !== null);
}

export async function getTransparencyRows(
  supabase: SupabaseClient,
  sanId: string,
  roundNumber: number,
  contributionAmount: number,
): Promise<TransparencyRow[]> {
  const [{ data: members }, { data: payments }] = await Promise.all([
    supabase
      .from("san_members")
      .select("*")
      .eq("san_id", sanId)
      .returns<SanMember[]>(),
    supabase
      .from("payments")
      .select("*")
      .eq("san_id", sanId)
      .eq("round_number", roundNumber)
      .returns<Payment[]>(),
  ]);

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds)
    .returns<Profile[]>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const paymentMap = new Map((payments ?? []).map((p) => [p.san_member_id, p]));

  return members
    .map((member) => {
      const profile = profileMap.get(member.user_id);
      if (!profile) return null;
      const payment = paymentMap.get(member.id) ?? null;
      return {
        member,
        profile,
        payment,
        status: getPaymentStatus(payment, contributionAmount),
      };
    })
    .filter((row): row is TransparencyRow => row !== null);
}

export interface ParticipantOption {
  userId: string;
  fullName: string;
  username: string | null;
  /** Turno que ya tiene en `currentSanId`, si aplica (se le sumaría un turno extra). */
  turnInThisSan?: number;
}

/**
 * Participantes que ya tienen cuenta por pertenecer a algún San de este mismo
 * admin (incluido `currentSanId`). Permite vincular a la misma persona a
 * varios sanes, o darle un turno adicional dentro del mismo San, sin
 * crearle una cuenta/contraseña duplicada.
 */
export async function getAdminParticipants(
  supabase: SupabaseClient,
  adminId: string,
  currentSanId: string,
): Promise<ParticipantOption[]> {
  const { data: sans } = await supabase
    .from("sans")
    .select("id")
    .eq("created_by", adminId)
    .returns<Pick<San, "id">[]>();

  const sanIds = (sans ?? []).map((s) => s.id);
  if (sanIds.length === 0) return [];

  const { data: members } = await supabase
    .from("san_members")
    .select("user_id, san_id, turn_number")
    .in("san_id", sanIds)
    .returns<Pick<SanMember, "user_id" | "san_id" | "turn_number">[]>();

  const turnInCurrentSan = new Map<string, number>();
  for (const m of members ?? []) {
    if (m.san_id === currentSanId) turnInCurrentSan.set(m.user_id, m.turn_number);
  }

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .in("id", userIds)
    .returns<Pick<Profile, "id" | "full_name" | "username">[]>();

  return (profiles ?? [])
    .map((p) => ({
      userId: p.id,
      fullName: p.full_name,
      username: p.username,
      turnInThisSan: turnInCurrentSan.get(p.id),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}
