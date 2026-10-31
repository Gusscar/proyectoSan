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
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
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
                "flex h-12 items-center justify-center rounded-lg text-base font-bold ring-2 ring-inset transition",
                member && received &&
                  "cursor-not-allowed bg-emerald-600 text-white ring-emerald-700",
                member && !received &&
                  "cursor-not-allowed bg-rose-100 text-rose-700 ring-rose-400",
                !member && isSelected &&
                  "cursor-pointer bg-indigo-600 text-white ring-indigo-700",
                !member && !isSelected &&
                  "cursor-pointer bg-emerald-50 text-emerald-700 ring-emerald-500 hover:bg-emerald-100",
              )}
            >
              {turn}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
        <Legend swatch="bg-emerald-50 ring-emerald-500" label="Disponible" />
        <Legend swatch="bg-rose-100 ring-rose-400" label="Ocupado" />
        <Legend swatch="bg-emerald-600 ring-emerald-700" label="Ya recibió" />
        <Legend swatch="bg-indigo-600 ring-indigo-700" label="Seleccionado" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3.5 w-3.5 rounded ring-2 ring-inset", swatch)} />
      {label}
    </span>
  );
}
