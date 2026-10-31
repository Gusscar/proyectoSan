"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, UserPlus } from "lucide-react";
import { computePayoutDate, normalizeUsername } from "@/lib/utils";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import type { Frequency } from "@/lib/supabase/types";

interface AddParticipantFormProps {
  sanId: string;
  startDate: string;
  frequency: Frequency;
  nextTurnNumber: number;
}

interface CreatedCredential {
  fullName: string;
  username: string;
  phone: string;
  tempPassword: string;
}

export function AddParticipantForm({
  sanId,
  startDate,
  frequency,
  nextTurnNumber,
}: AddParticipantFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [turnNumber, setTurnNumber] = useState(String(nextTurnNumber));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCredential | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCreated(null);

    const turn = Number(turnNumber);
    const payoutDate = computePayoutDate(startDate, frequency, turn - 1);
    const cleanUsername = normalizeUsername(username);

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          fullName,
          phone: phone || undefined,
          sanId,
          turnNumber: turn,
          payoutDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el participante");

      setCreated({
        fullName,
        username: cleanUsername,
        phone,
        tempPassword: data.tempPassword,
      });
      setUsername("");
      setFullName("");
      setPhone("");
      setTurnNumber(String(turn + 1));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
        <UserPlus className="h-4 w-4" />
        Agregar participante
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          type="text"
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input sm:col-span-2"
        />
        <input
          required
          type="text"
          placeholder="Usuario (para iniciar sesión)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input sm:col-span-2"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input"
        />
        <input
          required
          type="number"
          min="1"
          placeholder="Turno"
          value={turnNumber}
          onChange={(e) => setTurnNumber(e.target.value)}
          className="input"
        />

        {error && <p className="text-xs text-rose-400 sm:col-span-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-60 sm:col-span-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear acceso
        </button>
      </form>

      {created && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Participante creado
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-950 px-3 py-2">
            <div className="text-xs text-slate-300">
              <p>Usuario: {created.username}</p>
              <p className="font-mono text-emerald-400">
                {created.tempPassword}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(
                  `Usuario: ${created.username}\nContraseña temporal: ${created.tempPassword}`,
                )
              }
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Copiar credenciales"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <WhatsAppShareButton
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2 text-xs font-medium text-slate-950 transition hover:bg-[#25D366]/90"
            phone={created.phone}
            label="Enviar por WhatsApp"
            fullName={created.fullName}
            username={created.username}
            password={created.tempPassword}
          />
        </div>
      )}
    </div>
  );
}
