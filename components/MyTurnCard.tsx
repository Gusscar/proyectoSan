import { Calendar, Coins, Hash } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MyTurnCardProps {
  sanName: string;
  turnNumber: number;
  totalTurns: number;
  payoutDate: string;
  potAmount: number;
}

export function MyTurnCard({
  sanName,
  turnNumber,
  totalTurns,
  payoutDate,
  potAmount,
}: MyTurnCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-md">
      <p className="text-base font-semibold text-indigo-700">{sanName}</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">Tu turno</h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          icon={<Hash className="h-5 w-5" />}
          label="Número de turno"
          value={`${turnNumber} de ${totalTurns}`}
        />
        <Stat
          icon={<Calendar className="h-5 w-5" />}
          label="Fecha de cobro"
          value={formatDate(payoutDate)}
        />
        <Stat
          icon={<Coins className="h-5 w-5" />}
          label="Monto del pozo"
          value={formatCurrency(potAmount)}
          highlight
        />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p
        className={`mt-1.5 text-2xl font-bold ${
          highlight ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
