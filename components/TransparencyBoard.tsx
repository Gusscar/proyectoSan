import {
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import type { TransparencyRow } from "@/lib/supabase/types";

interface TransparencyBoardProps {
  rows: TransparencyRow[];
  contributionAmount: number;
  currentUserId?: string;
}

export function TransparencyBoard({
  rows,
  contributionAmount,
  currentUserId,
}: TransparencyBoardProps) {
  const sorted = [...rows].sort(
    (a, b) => a.member.turn_number - b.member.turn_number,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-100">
          Tabla de transparencia
        </h2>
        <p className="text-xs text-slate-500">
          Turnos, abonos del periodo actual y estado de cada participante.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Turno</th>
              <th className="px-5 py-3 font-medium">Participante</th>
              <th className="px-5 py-3 font-medium">Fecha de cobro</th>
              <th className="px-5 py-3 font-medium">Abonado</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {sorted.map((row) => {
              const isCurrentUser = row.profile.id === currentUserId;
              return (
                <tr
                  key={row.member.id}
                  className={cn(
                    "transition",
                    isCurrentUser && "bg-emerald-500/5",
                  )}
                >
                  <td className="px-5 py-3 text-slate-300">
                    #{row.member.turn_number}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-100">
                    {row.profile.full_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs font-normal text-emerald-400">
                        (tú)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {formatDate(row.member.payout_date)}
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {formatCurrency(row.payment?.amount_paid ?? 0)} /{" "}
                    {formatCurrency(contributionAmount)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        PAYMENT_STATUS_COLOR[row.status],
                      )}
                    >
                      {PAYMENT_STATUS_LABEL[row.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={5}
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
