import { cn, formatCurrency, getPaymentStatus, PAYMENT_STATUS_DOT_COLOR, PERIOD_LABEL } from "@/lib/utils";
import type { Frequency } from "@/lib/supabase/types";
import type { MemberPaymentHistory } from "@/lib/queries";

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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Historial de pagos
          </h2>
          <p className="text-sm text-slate-600">
            Estado de cada {periodLabel.toLowerCase()} por participante.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
          <LegendDot className="bg-emerald-600" label="Al día" />
          <LegendDot className="bg-amber-500" label="Incompleto" />
          <LegendDot className="bg-rose-600" label="Pendiente" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="sticky left-0 bg-white px-5 py-3">
                Participante
              </th>
              {periods.map((period) => (
                <th
                  key={period}
                  className={cn(
                    "px-3 py-3 text-center",
                    period === currentRound && "text-indigo-700",
                  )}
                >
                  {periodLabel} {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sorted.map((row) => {
              const isCurrentUser = row.profile.id === currentUserId;
              return (
                <tr key={row.member.id}>
                  <td
                    className={cn(
                      "sticky left-0 whitespace-nowrap bg-white px-5 py-3 font-medium text-slate-900",
                      isCurrentUser && "bg-emerald-50",
                    )}
                  >
                    {row.profile.full_name}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs font-normal text-emerald-700">
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
                            "inline-flex h-4 w-4 rounded-full ring-2",
                            PAYMENT_STATUS_DOT_COLOR[status],
                            period === currentRound && "ring-indigo-600",
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

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
