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

  const { data: memberships } = await supabase
    .from("san_members")
    .select("*, sans(*)")
    .eq("user_id", user.id)
    .returns<(SanMember & { sans: San })[]>();

  if (!memberships || memberships.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
        <p className="text-sm text-slate-400">
          Aún no perteneces a ningún San. Pide a tu administrador que te
          agregue.
        </p>
      </div>
    );
  }

  const sections = await Promise.all(
    memberships.map(async (membership) => {
      const san = membership.sans;
      const currentRound = getCurrentRound(
        san.start_date,
        san.frequency,
        san.total_turns,
      );
      const [rows, history] = await Promise.all([
        getTransparencyRows(supabase, san.id, currentRound, san.contribution_amount),
        getPaymentsHistory(supabase, san.id),
      ]);
      return { san, membership, rows, history, currentRound };
    }),
  );

  return (
    <div className="space-y-8">
      {sections.map(({ san, membership, rows, history, currentRound }) => (
        <section key={san.id} className="space-y-4">
          <AnnouncementBanner announcement={san.announcement} />
          <MyTurnCard
            sanName={san.name}
            turnNumber={membership.turn_number}
            totalTurns={san.total_turns}
            payoutDate={membership.payout_date}
            potAmount={san.contribution_amount * san.total_turns}
          />
          <TransparencyBoard
            rows={rows}
            contributionAmount={san.contribution_amount}
            currentUserId={user.id}
          />
          <PaymentsMatrix
            rows={history}
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
