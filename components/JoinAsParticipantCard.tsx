"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck } from "lucide-react";
import { joinSanAsAdmin } from "@/app/actions/san-actions";
import { computePayoutDate } from "@/lib/utils";
import { TurnsGrid, type OccupiedTurn } from "@/components/TurnsGrid";
import type { Frequency } from "@/lib/supabase/types";

interface JoinAsParticipantCardProps {
  sanId: string;
  startDate: string;
  frequency: Frequency;
  totalTurns: number;
  occupiedTurns: OccupiedTurn[];
}

function firstAvailableTurn(totalTurns: number, occupied: OccupiedTurn[]) {
  const taken = new Set(occupied.map((o) => o.turnNumber));
  for (let i = 1; i <= totalTurns; i++) {
    if (!taken.has(i)) return i;
  }
  return null;
}

export function JoinAsParticipantCard({
  sanId,
  startDate,
  frequency,
  totalTurns,
  occupiedTurns,
}: JoinAsParticipantCardProps) {
  const router = useRouter();
  const [turnNumber, setTurnNumber] = useState<number | null>(() =>
    firstAvailableTurn(totalTurns, occupiedTurns),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noTurnsLeft = firstAvailableTurn(totalTurns, occupiedTurns) === null;

  async function handleJoin() {
    if (!turnNumber) return;
    setLoading(true);
    setError(null);
    try {
      const payoutDate = computePayoutDate(startDate, frequency, turnNumber - 1);
      await joinSanAsAdmin(sanId, turnNumber, payoutDate);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo unir al San");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-100">
        <UserCheck className="h-4 w-4 text-indigo-400" />
        ¿Tú también participas en este San?
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Si el administrador también aporta y recibe turno, elige tu lugar
        aquí (por ejemplo, el último).
      </p>

      {noTurnsLeft ? (
        <p className="text-xs text-rose-400">
          No quedan turnos disponibles en este San.
        </p>
      ) : (
        <>
          <TurnsGrid
            totalTurns={totalTurns}
            occupied={occupiedTurns}
            value={turnNumber}
            onChange={setTurnNumber}
          />

          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={loading || !turnNumber}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Unirme como participante
          </button>
        </>
      )}
    </div>
  );
}
