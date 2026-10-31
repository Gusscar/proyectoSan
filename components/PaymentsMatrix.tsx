import { cn, formatCurrency, getPaymentStatus, PAYMENT_STATUS_COLOR } from "@/lib/utils";
import type { Frequency } from "@/lib/supabase/types";
import type { MemberPaymentHistory } from "@/lib/queries";

const PERIOD_LABEL: Record<Frequency, string> = {
  weekly: "Semana",
  biweekly: "Quincena",
  monthly: "Mes",
};

interface PaymentsMatrixProps {
  rows: MemberPaymentHistory[];
  totalTurns: number;
  contributionAmount: number;
  frequency: Frequency;
  currentRound: number;
  currentUserId?: string;
}

export function PaymentsMatrix({
  rows,
  totalTurns,
  contributionAmount,
  frequency,
  currentRound,
  currentUserId,
}: PaymentsMatrixProps) {
  const periods = Array.from({ length: totalTurns }, (_, i) => i + 1);
  const sorted = [...rows].sort(
    (a, b) => a.member.turn_number - b.member.turn_number,
  );
  const periodLabel = PERIOD_LABEL[frequency];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-100">
          Historial de pagos
        </h2>
        <p className="text-xs text-slate-500">
          Estado de cada {periodLabel.toLowerCase()} por participante.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="sticky left-0 bg-slate-900/60 px-5 py-3 font-medium">
                Participante
              </th>
              {periods.map((period) => (
                <th
                  key={period}
                  className={cn(
                    "px-3 py-3 text-center font-medium",
                    period === currentRound && "text-indigo-400",
                  )}
                >
                  {periodLabel} {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {sorted.map((row) => {
              const isCurrentUser = row.profile.id === currentUserId;
              return (
                <tr key={row.member.id}>
                  <td
                    className={cn(
                      "sticky left-0 whitespace-nowrap bg-slate-900 px-5 py-3 font-medium text-slate-100",
                      isCurrentUser && "bg-emerald-500/5",
                    )}
                  >
                    {row.profile.full_name}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs font-normal text-emerald-400">
                        (tú)
                      </span>
                    )}
                  </td>
                  {periods.map((period) => {
                    const payment = row.paymentsByRound.get(period) ?? null;
                    const status = getPaymentStatus(payment, contributionAmount);
                    const amount = payment?.amount_paid ?? 0;
                    return (
                      <td key={period} className="px-3 py-3 text-center">
                        <span
                          title={`${periodLabel} ${period}: ${formatCurrency(amount)} de ${formatCurrency(contributionAmount)}`}
                          className={cn(
                            "inline-flex h-3 w-3 rounded-full ring-1 ring-inset",
                            PAYMENT_STATUS_COLOR[status],
                            period === currentRound && "ring-2 ring-indigo-400",
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={periods.length + 1}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Aún no hay participantes en este San.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
