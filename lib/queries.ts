import type { SupabaseClient } from "@supabase/supabase-js";
import type { Payment, Profile, SanMember, TransparencyRow } from "./supabase/types";
import { getPaymentStatus } from "./utils";

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
  const paymentMap = new Map((payments ?? []).map((p) => [p.user_id, p]));

  return members
    .map((member) => {
      const profile = profileMap.get(member.user_id);
      if (!profile) return null;
      const payment = paymentMap.get(member.user_id) ?? null;
      return {
        member,
        profile,
        payment,
        status: getPaymentStatus(payment, contributionAmount),
      };
    })
    .filter((row): row is TransparencyRow => row !== null);
}
