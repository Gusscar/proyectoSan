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
  /**
   * Oculta el abono y el estado de pago de los demás participantes — solo
   * deja ver el calendario de turnos (quién cobra y cuándo). El historial
   * de abonos de cada quien es privado para los miembros normales.
   */
  restricted?: boolean;
}

export function TransparencyBoard({
  rows,
  contributionAmount,
  currentUserId,
  restricted = false,
}: TransparencyBoardProps) {
  const sorted = [...rows].sort(
    (a, b) => a.member.turn_number - b.member.turn_number,
  );
  const columnCount = restricted ? 4 : 5;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          Tabla de transparencia
        </h2>
        <p className="text-sm text-slate-600">
          {restricted
            ? "Orden de turnos y fecha en la que cobra cada participante."
            : "Turnos, abonos del periodo actual y estado de cada participante."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Turno</th>
              <th className="px-5 py-3">Participante</th>
              <th className="px-5 py-3">Fecha de cobro</th>
              {restricted ? (
                <th className="px-5 py-3">Entrega del pozo</th>
              ) : (
                <>
                  <th className="px-5 py-3">Abonado</th>
                  <th className="px-5 py-3">Estado</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sorted.map((row) => {
              const isCurrentUser = row.profile.id === currentUserId;
              return (
                <tr
                  key={row.member.id}
                  className={cn(
                    "transition",
                    isCurrentUser && "bg-emerald-50",
                  )}
                >
                  <td className="px-5 py-3 font-medium text-slate-700">
                    #{row.member.turn_number}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {row.profile.full_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs font-normal text-emerald-700">
                        (tú)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDate(row.member.payout_date)}
                  </td>
                  {restricted ? (
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-2 ring-inset",
                          row.member.payout_received
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-500"
                            : "bg-slate-100 text-slate-600 ring-slate-300",
                        )}
                      >
                        {row.member.payout_received ? "Ya cobró" : "Pendiente"}
                      </span>
                    </td>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-slate-700">
                        {formatCurrency(row.payment?.amount_paid ?? 0)} /{" "}
                        {formatCurrency(contributionAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-2 ring-inset",
                            PAYMENT_STATUS_COLOR[row.status],
                          )}
                        >
                          {PAYMENT_STATUS_LABEL[row.status]}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={columnCount}
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
