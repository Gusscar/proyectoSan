import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTransparencyRows, getPaymentsHistory } from "@/lib/queries";
import { getCurrentRound } from "@/lib/utils";
import { MyTurnCard } from "@/components/MyTurnCard";
import { TransparencyBoard } from "@/components/TransparencyBoard";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { PaymentsMatrix } from "@/components/PaymentsMatrix";
import type { San, SanMember } from "@/lib/supabase/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  const { data: memberships } = await supabase
    .from("san_members")
    .select("*, sans(*)")
    .eq("user_id", user.id)
    .returns<(SanMember & { sans: San })[]>();

  if (!memberships || memberships.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-base text-slate-600">
          Aún no perteneces a ningún San. Pide a tu administrador que te
          agregue.
        </p>
      </div>
    );
  }

  // Si una persona tiene 2+ turnos en el mismo San, viene como 2+ filas de
  // `memberships` con el mismo `san.id`: se agrupan para mostrar ese San UNA
  // sola vez, con una MyTurnCard por cada turno que tenga ahí.
  const bySan = new Map<string, { san: San; memberships: SanMember[] }>();
  for (const membership of memberships) {
    const entry = bySan.get(membership.san_id) ?? {
      san: membership.sans,
      memberships: [],
    };
    entry.memberships.push(membership);
    bySan.set(membership.san_id, entry);
  }

  const sections = await Promise.all(
    [...bySan.values()].map(async ({ san, memberships: sanMemberships }) => {
      const currentRound = getCurrentRound(
        san.start_date,
        san.frequency,
        san.total_turns,
      );
      const [rows, history] = await Promise.all([
        getTransparencyRows(supabase, san.id, currentRound, san.contribution_amount),
        getPaymentsHistory(supabase, san.id),
      ]);
      return { san, memberships: sanMemberships, rows, history, currentRound };
    }),
  );

  return (
    <div className="space-y-8">
      {sections.map(({ san, memberships: sanMemberships, rows, history, currentRound }) => (
        <section key={san.id} className="space-y-4">
          <AnnouncementBanner announcement={san.announcement} />
          {sanMemberships.map((membership) => (
            <MyTurnCard
              key={membership.id}
              sanName={san.name}
              turnNumber={membership.turn_number}
              totalTurns={san.total_turns}
              payoutDate={membership.payout_date}
              potAmount={san.contribution_amount * san.total_turns}
            />
          ))}
          <TransparencyBoard
            rows={rows}
            contributionAmount={san.contribution_amount}
            currentUserId={user.id}
            restricted={!isAdmin}
          />
          <PaymentsMatrix
            rows={
              isAdmin
                ? history
                : history.filter((h) => h.profile.id === user.id)
            }
            totalTurns={san.total_turns}
            contributionAmount={san.contribution_amount}
            frequency={san.frequency}
            currentRound={currentRound}
            currentUserId={user.id}
          />
        </section>
      ))}
    </div>
  );
}
