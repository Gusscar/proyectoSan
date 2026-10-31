import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTransparencyRows, getPaymentsHistory } from "@/lib/queries";
import { getCurrentRound, formatCurrency, formatDate } from "@/lib/utils";
import { AnnouncementEditor } from "@/components/AnnouncementEditor";
import { AddParticipantForm } from "@/components/AddParticipantForm";
import { ReorderTurnsList } from "@/components/ReorderTurnsList";
import { LogPaymentModal } from "@/components/LogPaymentModal";
import { PaymentsMatrix } from "@/components/PaymentsMatrix";

export default async function ManageSanPage(props: PageProps<"/admin/manage/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const supabase = await createClient();

  const { data: san } = await supabase
    .from("sans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!san) notFound();

  const defaultRound = getCurrentRound(
    san.start_date,
    san.frequency,
    san.total_turns,
  );
  const roundParam = Array.isArray(searchParams.round)
    ? searchParams.round[0]
    : searchParams.round;
  const round = Math.min(
    Math.max(Number(roundParam) || defaultRound, 1),
    san.total_turns,
  );

  const [rows, history] = await Promise.all([
    getTransparencyRows(supabase, san.id, round, san.contribution_amount),
    getPaymentsHistory(supabase, san.id),
  ]);

  const sortedRows = [...rows].sort(
    (a, b) => a.member.turn_number - b.member.turn_number,
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-slate-100">{san.name}</h1>
        <p className="text-sm text-slate-500">
          {formatCurrency(san.contribution_amount)} ·{" "}
          {san.total_turns} turnos · inicia {formatDate(san.start_date)}
        </p>
      </div>

      <AnnouncementEditor sanId={san.id} currentAnnouncement={san.announcement} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AddParticipantForm
          sanId={san.id}
          startDate={san.start_date}
          frequency={san.frequency}
          totalTurns={san.total_turns}
          occupiedTurns={sortedRows.map((row) => ({
            turnNumber: row.member.turn_number,
            fullName: row.profile.full_name,
            payoutDate: row.member.payout_date,
          }))}
        />
        <ReorderTurnsList
          sanId={san.id}
          startDate={san.start_date}
          frequency={san.frequency}
          members={rows.map((row) => ({
            id: row.member.id,
            fullName: row.profile.full_name,
            turnNumber: row.member.turn_number,
            payoutDate: row.member.payout_date,
          }))}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Abonos — periodo {round} de {san.total_turns}
            </h2>
            <p className="text-xs text-slate-500">
              Registra abonos parciales o pagos completos por participante.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/manage/${san.id}?round=${Math.max(round - 1, 1)}`}
              className="flex-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-center text-xs text-slate-400 hover:bg-slate-800 sm:flex-none"
            >
              Anterior
            </Link>
            <Link
              href={`/admin/manage/${san.id}?round=${Math.min(round + 1, san.total_turns)}`}
              className="flex-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-center text-xs text-slate-400 hover:bg-slate-800 sm:flex-none"
            >
              Siguiente
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Turno</th>
                <th className="px-5 py-3 font-medium">Participante</th>
                <th className="px-5 py-3 font-medium">Abonado</th>
                <th className="px-5 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {sortedRows.map((row) => (
                <tr key={row.member.id}>
                  <td className="px-5 py-3 text-slate-300">
                    #{row.member.turn_number}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-100">
                    {row.profile.full_name}
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {formatCurrency(row.payment?.amount_paid ?? 0)} /{" "}
                    {formatCurrency(san.contribution_amount)}
                  </td>
                  <td className="px-5 py-3">
                    <LogPaymentModal
                      sanId={san.id}
                      userId={row.profile.id}
                      memberName={row.profile.full_name}
                      roundNumber={round}
                      contributionAmount={san.contribution_amount}
                      amountPaid={row.payment?.amount_paid ?? 0}
                    />
                  </td>
                </tr>
              ))}
              {sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-slate-500"
                  >
                    Agrega participantes para comenzar a registrar abonos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentsMatrix
        rows={history}
        totalTurns={san.total_turns}
        contributionAmount={san.contribution_amount}
        frequency={san.frequency}
        currentRound={round}
      />
    </div>
  );
}
