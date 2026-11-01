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
import { PayoutStatusToggle } from "@/components/PayoutStatusToggle";
import { PaymentsMatrix } from "@/components/PaymentsMatrix";
import { JoinAsParticipantCard } from "@/components/JoinAsParticipantCard";

export default async function ManageSanPage(props: PageProps<"/admin/manage/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const isAdminAlreadyMember = sortedRows.some(
    (row) => row.profile.id === user?.id,
  );
  const occupiedTurns = sortedRows.map((row) => ({
    turnNumber: row.member.turn_number,
    fullName: row.profile.full_name,
    payoutDate: row.member.payout_date,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-base font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{san.name}</h1>
        <p className="text-base text-slate-600">
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
          occupiedTurns={occupiedTurns}
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

      {!isAdminAlreadyMember && (
        <JoinAsParticipantCard
          sanId={san.id}
          startDate={san.start_date}
          frequency={san.frequency}
          totalTurns={san.total_turns}
          occupiedTurns={occupiedTurns}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Abonos — periodo {round} de {san.total_turns}
            </h2>
            <p className="text-sm text-slate-600">
              Registra abonos parciales o pagos completos por participante.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/manage/${san.id}?round=${Math.max(round - 1, 1)}`}
              className="flex-1 rounded-lg border-2 border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:flex-none"
            >
              Anterior
            </Link>
            <Link
              href={`/admin/manage/${san.id}?round=${Math.min(round + 1, san.total_turns)}`}
              className="flex-1 rounded-lg border-2 border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:flex-none"
            >
              Siguiente
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Turno</th>
                <th className="px-5 py-3">Participante</th>
                <th className="px-5 py-3">Abonado</th>
                <th className="px-5 py-3">Acción</th>
                <th className="px-5 py-3">Entrega del pozo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedRows.map((row) => (
                <tr key={row.member.id}>
                  <td className="px-5 py-3 font-medium text-slate-700">
                    #{row.member.turn_number}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {row.profile.full_name}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
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
                  <td className="px-5 py-3">
                    <PayoutStatusToggle
                      sanId={san.id}
                      memberId={row.member.id}
                      received={row.member.payout_received}
                    />
                  </td>
                </tr>
              ))}
              {sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
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
