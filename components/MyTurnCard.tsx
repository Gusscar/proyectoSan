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
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-900 p-6 shadow-xl shadow-black/20">
      <p className="text-sm font-medium text-indigo-400">{sanName}</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-100">Tu turno</h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          icon={<Hash className="h-4 w-4" />}
          label="Número de turno"
          value={`${turnNumber} de ${totalTurns}`}
        />
        <Stat
          icon={<Calendar className="h-4 w-4" />}
          label="Fecha de cobro"
          value={formatDate(payoutDate)}
        />
        <Stat
          icon={<Coins className="h-4 w-4" />}
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
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p
        className={`mt-1.5 text-lg font-semibold ${
          highlight ? "text-emerald-400" : "text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
