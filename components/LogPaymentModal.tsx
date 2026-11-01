"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, Wallet, X } from "lucide-react";
import { addPaymentAbono, correctPaymentAmount } from "@/app/actions/payment-actions";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatCurrency, PERIOD_LABEL } from "@/lib/utils";
import type { Frequency } from "@/lib/supabase/types";

interface LogPaymentModalProps {
  sanId: string;
  userId: string;
  memberName: string;
  initialRound: number;
  totalTurns: number;
  frequency: Frequency;
  contributionAmount: number;
  paidByRound: Record<number, number>;
}

export function LogPaymentModal({
  sanId,
  userId,
  memberName,
  initialRound,
  totalTurns,
  frequency,
  contributionAmount,
  paidByRound,
}: LogPaymentModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(initialRound);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [correctedAmount, setCorrectedAmount] = useState("");

  const periodLabel = PERIOD_LABEL[frequency];
  const amountPaid = paidByRound[round] ?? 0;
  const remaining = Math.max(contributionAmount - amountPaid, 0);

  async function submit(amountToAdd: number) {
    setLoading(true);
    setError(null);
    try {
      await addPaymentAbono(sanId, userId, round, amountToAdd);
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

  async function handleCorrect(event: FormEvent) {
    event.preventDefault();
    const value = Number(correctedAmount);
    if (!Number.isFinite(value) || value < 0) {
      setError("Ingresa un monto válido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await correctPaymentAmount(sanId, userId, round, value);
      setEditing(false);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al corregir el abono");
    } finally {
      setLoading(false);
    }
  }

  const isComplete = remaining <= 0;

  return (
    <>
      <button
        onClick={() => {
          setRound(initialRound);
          setEditing(false);
          setError(null);
          setOpen(true);
        }}
        className={
          isComplete
            ? "inline-flex items-center gap-1.5 rounded-lg border-2 border-emerald-600 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            : "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        }
      >
        {isComplete ? <CircleCheck className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
        {isComplete ? "Completo" : "Registrar abono"}
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

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {periodLabel}
              </span>
              <select
                value={round}
                onChange={(e) => {
                  setRound(Number(e.target.value));
                  setEditing(false);
                  setError(null);
                }}
                className="input"
              >
                {Array.from({ length: totalTurns }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>
                    {periodLabel} {p}
                  </option>
                ))}
              </select>
            </label>

            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                Abonado: {formatCurrency(amountPaid)} de{" "}
                {formatCurrency(contributionAmount)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCorrectedAmount(String(amountPaid));
                  setError(null);
                  setEditing((v) => !v);
                }}
                className="text-sm font-medium text-indigo-700 hover:underline"
              >
                {editing ? "Cancelar" : "Corregir"}
              </button>
            </div>

            {editing && (
              <form onSubmit={handleCorrect} className="mb-4 space-y-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Monto correcto abonado en {periodLabel.toLowerCase()} {round}
                  </span>
                  <CurrencyInput
                    autoFocus
                    value={correctedAmount}
                    onChange={setCorrectedAmount}
                    placeholder="0"
                  />
                </label>
                {error && <p className="text-sm font-medium text-rose-700">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar corrección
                </button>
              </form>
            )}

            {!editing && remaining > 0 && (
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
