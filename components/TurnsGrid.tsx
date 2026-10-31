"use client";

import { cn } from "@/lib/utils";

export interface OccupiedTurn {
  turnNumber: number;
  fullName: string;
  payoutDate: string;
}

interface TurnsGridProps {
  totalTurns: number;
  occupied: OccupiedTurn[];
  value: number | null;
  onChange: (turn: number) => void;
}

export function TurnsGrid({ totalTurns, occupied, value, onChange }: TurnsGridProps) {
  const occupiedMap = new Map(occupied.map((o) => [o.turnNumber, o]));
  const today = new Date();
  const turns = Array.from({ length: totalTurns }, (_, i) => i + 1);

  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {turns.map((turn) => {
          const member = occupiedMap.get(turn);
          const received = member ? new Date(member.payoutDate) <= today : false;
          const isSelected = value === turn;

          return (
            <button
              key={turn}
              type="button"
              disabled={!!member}
              onClick={() => onChange(turn)}
              title={
                member
                  ? `${member.fullName} — ${received ? "ya recibió" : "ocupado, pendiente de cobrar"}`
                  : "Disponible"
              }
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs font-medium ring-1 ring-inset transition",
                member && received &&
                  "cursor-not-allowed bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
                member && !received &&
                  "cursor-not-allowed bg-rose-500/15 text-rose-400 ring-rose-500/30",
                !member && isSelected &&
                  "bg-indigo-500 text-white ring-indigo-400",
                !member && !isSelected &&
                  "cursor-pointer bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 hover:bg-emerald-500/20",
              )}
            >
              {turn}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <Legend swatch="bg-emerald-500/10 ring-emerald-500/20" label="Disponible" />
        <Legend swatch="bg-rose-500/15 ring-rose-500/30" label="Ocupado" />
        <Legend swatch="bg-emerald-500/20 ring-emerald-500/40" label="Ya recibió" />
        <Legend swatch="bg-indigo-500 ring-indigo-400" label="Seleccionado" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded ring-1 ring-inset", swatch)} />
      {label}
    </span>
  );
}
