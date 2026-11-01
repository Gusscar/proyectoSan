"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, HandCoins, Loader2 } from "lucide-react";
import { setPayoutReceived } from "@/app/actions/san-actions";

interface PayoutStatusToggleProps {
  sanId: string;
  memberId: string;
  received: boolean;
}

export function PayoutStatusToggle({
  sanId,
  memberId,
  received,
}: PayoutStatusToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      await setPayoutReceived(sanId, memberId, !received);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el estado",
      );
    } finally {
      setLoading(false);
    }
  }

  if (received) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
          <CircleCheck className="h-5 w-5" />
          Pagado
        </span>
        <button
          onClick={toggle}
          disabled={loading}
          className="text-xs font-medium text-slate-500 underline hover:text-slate-700 disabled:opacity-60"
        >
          Deshacer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <HandCoins className="h-4 w-4" />
        )}
        Marcar pagado
      </button>
      {error && <p className="text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
}
