"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, Wallet, X } from "lucide-react";
import { addPaymentAbono } from "@/app/actions/payment-actions";
import { formatCurrency } from "@/lib/utils";

interface LogPaymentModalProps {
  sanId: string;
  userId: string;
  memberName: string;
  roundNumber: number;
  contributionAmount: number;
  amountPaid: number;
}

export function LogPaymentModal({
  sanId,
  userId,
  memberName,
  roundNumber,
  contributionAmount,
  amountPaid,
}: LogPaymentModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(contributionAmount - amountPaid, 0);

  async function submit(amountToAdd: number) {
    setLoading(true);
    setError(null);
    try {
      await addPaymentAbono(sanId, userId, roundNumber, amountToAdd);
      setOpen(false);
      setAmount("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    submit(value);
  }

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <CircleCheck className="h-4 w-4" /> Completo
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30 transition hover:bg-emerald-500/20"
      >
        <Wallet className="h-3.5 w-3.5" />
        Registrar abono
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Registrar abono
                </h3>
                <p className="text-xs text-slate-500">{memberName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-xs text-slate-400">
              Pendiente del periodo: {formatCurrency(remaining)} de{" "}
              {formatCurrency(contributionAmount)}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Monto a abonar"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none ring-emerald-500/50 placeholder:text-slate-600 focus:ring-2"
              />

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => submit(remaining)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-60"
                >
                  Marcar completo
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Guardar abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
