"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Save } from "lucide-react";
import { reorderTurns } from "@/app/actions/san-actions";
import { computePayoutDate, formatDate } from "@/lib/utils";
import type { Frequency } from "@/lib/supabase/types";

export interface ReorderMember {
  id: string;
  fullName: string;
  turnNumber: number;
  payoutDate: string;
}

interface ReorderTurnsListProps {
  sanId: string;
  startDate: string;
  frequency: Frequency;
  members: ReorderMember[];
}

export function ReorderTurnsList({
  sanId,
  startDate,
  frequency,
  members,
}: ReorderTurnsListProps) {
  const router = useRouter();
  const [order, setOrder] = useState(
    [...members].sort((a, b) => a.turnNumber - b.turnNumber),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // `useState`'s initializer solo corre una vez: si el admin agrega o
  // reordena participantes y el servidor pasa un `members` nuevo, el
  // estado local no se enteraba hasta recargar la página a mano. Se
  // resincroniza acá, salvo que el admin ya esté reordenando (dirty).
  useEffect(() => {
    if (!dirty) {
      setOrder([...members].sort((a, b) => a.turnNumber - b.turnNumber));
    }
  }, [members, dirty]);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await reorderTurns(
        sanId,
        order.map((member, index) => ({
          id: member.id,
          turnNumber: index + 1,
          payoutDate: computePayoutDate(startDate, frequency, index),
        })),
      );
      setDirty(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reordenar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Orden de turnos
        </h2>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar orden
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm font-medium text-rose-700">{error}</p>}

      <ul className="space-y-2">
        {order.map((member, index) => {
          const payoutDate = dirty
            ? computePayoutDate(startDate, frequency, index)
            : member.payoutDate;
          const received = new Date(payoutDate) <= new Date();
          return (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div>
              <p className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
                #{dirty ? index + 1 : member.turnNumber} · {member.fullName}
                {received && (
                  <span
                    title="Ya recibió el pozo"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Ya recibió
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-600">
                Cobra: {formatDate(payoutDate)}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 disabled:opacity-30"
                aria-label="Subir"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 disabled:opacity-30"
                aria-label="Bajar"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
