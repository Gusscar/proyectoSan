"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, Wallet, X } from "lucide-react";
import { addPaymentAbono } from "@/app/actions/payment-actions";
import { CurrencyInput } from "@/components/CurrencyInput";
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
    if (!Number.isFinite(value) || value <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (value > remaining + 0.01) {
      setError(`El monto no puede superar lo pendiente (${formatCurrency(remaining)})`);
      return;
    }
    submit(value);
  }

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <CircleCheck className="h-5 w-5" /> Completo
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <Wallet className="h-4 w-4" />
        Registrar abono
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Registrar abono
                </h3>
                <p className="text-sm text-slate-600">{memberName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm font-medium text-slate-700">
              Pendiente del periodo: {formatCurrency(remaining)} de{" "}
              {formatCurrency(contributionAmount)}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <CurrencyInput
                autoFocus
                value={amount}
                onChange={setAmount}
                placeholder="Monto a abonar"
              />

              {error && <p className="text-sm font-medium text-rose-700">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => submit(remaining)}
                  className="flex-1 rounded-lg border-2 border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  Marcar completo
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
