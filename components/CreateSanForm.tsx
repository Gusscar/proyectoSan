"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { createSan } from "@/app/actions/san-actions";
import { CurrencyInput } from "@/components/CurrencyInput";
import type { Frequency } from "@/lib/supabase/types";

export function CreateSanForm() {
  const [name, setName] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState("");
  const [totalTurns, setTotalTurns] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const amount = Number(contributionAmount);
    const turns = Number(totalTurns);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("El monto por periodo debe ser mayor a 0");
      return;
    }
    if (!Number.isInteger(turns) || turns <= 0) {
      setError("El total de turnos debe ser un número entero mayor a 0");
      return;
    }

    setLoading(true);
    try {
      await createSan({
        name,
        contributionAmount: amount,
        frequency,
        startDate,
        totalTurns: turns,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el San");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <Field label="Nombre del San">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="San familiar 2026"
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Monto por periodo">
          <CurrencyInput
            required
            value={contributionAmount}
            onChange={setContributionAmount}
            placeholder="50.000,00"
          />
        </Field>

        <Field label="Frecuencia">
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className="input"
          >
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="monthly">Mensual</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha de inicio">
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Total de turnos">
          <input
            required
            type="number"
            min="1"
            value={totalTurns}
            onChange={(e) => setTotalTurns(e.target.value)}
            placeholder="12"
            className="input"
          />
        </Field>
      </div>

      {error && <p className="text-sm font-medium text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        Crear San
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
