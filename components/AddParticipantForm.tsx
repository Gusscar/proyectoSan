"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Link2, Loader2, UserPlus } from "lucide-react";
import { addExistingParticipant } from "@/app/actions/san-actions";
import { cn, computePayoutDate, normalizeUsername } from "@/lib/utils";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { TurnsGrid, type OccupiedTurn } from "@/components/TurnsGrid";
import type { Frequency } from "@/lib/supabase/types";
import type { ParticipantOption } from "@/lib/queries";

interface AddParticipantFormProps {
  sanId: string;
  startDate: string;
  frequency: Frequency;
  totalTurns: number;
  occupiedTurns: OccupiedTurn[];
  existingParticipants: ParticipantOption[];
}

interface CreatedCredential {
  fullName: string;
  username: string;
  phone: string;
  tempPassword: string;
  turnNumbers: number[];
}

function firstAvailableTurn(totalTurns: number, occupied: OccupiedTurn[]) {
  const taken = new Set(occupied.map((o) => o.turnNumber));
  for (let i = 1; i <= totalTurns; i++) {
    if (!taken.has(i)) return i;
  }
  return null;
}

export function AddParticipantForm({
  sanId,
  startDate,
  frequency,
  totalTurns,
  occupiedTurns,
  existingParticipants,
}: AddParticipantFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newTurnNumbers, setNewTurnNumbers] = useState<number[]>(() => {
    const first = firstAvailableTurn(totalTurns, occupiedTurns);
    return first !== null ? [first] : [];
  });
  const [turnNumber, setTurnNumber] = useState<number | null>(() =>
    firstAvailableTurn(totalTurns, occupiedTurns),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCredential | null>(null);
  const [linked, setLinked] = useState<string | null>(null);

  useEffect(() => {
    const taken = new Set(occupiedTurns.map((o) => o.turnNumber));
    setTurnNumber((prev) =>
      prev !== null && !taken.has(prev)
        ? prev
        : firstAvailableTurn(totalTurns, occupiedTurns),
    );
    setNewTurnNumbers((prev) => {
      const stillFree = prev.filter((t) => !taken.has(t));
      if (stillFree.length > 0) return stillFree;
      const first = firstAvailableTurn(totalTurns, occupiedTurns);
      return first !== null ? [first] : [];
    });
  }, [occupiedTurns, totalTurns]);

  function toggleNewTurn(turn: number) {
    setNewTurnNumbers((prev) =>
      prev.includes(turn)
        ? prev.filter((t) => t !== turn)
        : [...prev, turn].sort((a, b) => a - b),
    );
  }

  async function handleCreateNew(event: FormEvent) {
    event.preventDefault();
    if (newTurnNumbers.length === 0) {
      setError("Elige al menos un turno disponible");
      return;
    }
    setLoading(true);
    setError(null);
    setCreated(null);

    const payoutDates = newTurnNumbers.map((t) =>
      computePayoutDate(startDate, frequency, t - 1),
    );
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
          turnNumbers: newTurnNumbers,
          payoutDates,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el participante");

      setCreated({
        fullName,
        username: cleanUsername,
        phone,
        tempPassword: data.tempPassword,
        turnNumbers: newTurnNumbers,
      });
      setUsername("");
      setFullName("");
      setPhone("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExisting(event: FormEvent) {
    event.preventDefault();
    if (!turnNumber) {
      setError("Elige un turno disponible");
      return;
    }
    if (!selectedUserId) {
      setError("Elige a qué participante vincular");
      return;
    }
    setLoading(true);
    setError(null);
    setLinked(null);

    const payoutDate = computePayoutDate(startDate, frequency, turnNumber - 1);
    const participant = existingParticipants.find((p) => p.userId === selectedUserId);

    try {
      await addExistingParticipant(sanId, selectedUserId, turnNumber, payoutDate);
      setLinked(participant?.fullName ?? "Participante");
      setSelectedUserId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const noTurnsLeft = firstAvailableTurn(totalTurns, occupiedTurns) === null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
        <UserPlus className="h-5 w-5 text-indigo-700" />
        Agregar participante
      </h2>

      <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode("new");
            setError(null);
            setLinked(null);
          }}
          className={cn(
            "flex-1 rounded-md py-2 transition",
            mode === "new" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600",
          )}
        >
          Nuevo
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("existing");
            setError(null);
            setCreated(null);
          }}
          className={cn(
            "flex-1 rounded-md py-2 transition",
            mode === "existing" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600",
          )}
        >
          Ya tiene cuenta
        </button>
      </div>

      {mode === "new" ? (
        <form onSubmit={handleCreateNew} className="space-y-3">
          <input
            required
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
          />
          <input
            required
            type="text"
            placeholder="Usuario (para iniciar sesión)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
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

          <div>
            <span className="mb-1.5 block text-base font-medium text-slate-700">
              Turno(s)
            </span>
            <p className="mb-1.5 text-sm text-slate-500">
              Elige más de uno si esta persona aporta por partida doble.
            </p>
            {noTurnsLeft ? (
              <p className="text-sm font-medium text-rose-700">
                No quedan turnos disponibles en este San.
              </p>
            ) : (
              <TurnsGrid
                totalTurns={totalTurns}
                occupied={occupiedTurns}
                value={newTurnNumbers}
                onChange={toggleNewTurn}
              />
            )}
          </div>

          {error && <p className="text-sm font-medium text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading || noTurnsLeft || newTurnNumbers.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {newTurnNumbers.length > 1
              ? `Crear acceso (${newTurnNumbers.length} turnos)`
              : "Crear acceso"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAddExisting} className="space-y-3">
          {existingParticipants.length === 0 ? (
            <p className="text-sm text-slate-600">
              Ningún participante de tus otros Sans está disponible para
              vincular aquí.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Elige a alguien que ya participa en otro de tus Sans (o
                dale un turno extra en este mismo). Va a usar el mismo
                usuario y contraseña para ver todo al iniciar sesión.
              </p>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input"
              >
                <option value="">Selecciona un participante…</option>
                {existingParticipants.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.fullName}
                    {p.username ? ` (${p.username})` : ""}
                    {p.turnInThisSan
                      ? ` — ya tiene turno #${p.turnInThisSan} aquí, se le agregaría un turno extra`
                      : ""}
                  </option>
                ))}
              </select>

              <div>
                <span className="mb-1.5 block text-base font-medium text-slate-700">
                  Turno
                </span>
                {noTurnsLeft ? (
                  <p className="text-sm font-medium text-rose-700">
                    No quedan turnos disponibles en este San.
                  </p>
                ) : (
                  <TurnsGrid
                    totalTurns={totalTurns}
                    occupied={occupiedTurns}
                    value={turnNumber}
                    onChange={setTurnNumber}
                  />
                )}
              </div>

              {error && <p className="text-sm font-medium text-rose-700">{error}</p>}

              <button
                type="submit"
                disabled={loading || noTurnsLeft}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Link2 className="h-5 w-5" />
                )}
                Vincular a este San
              </button>
            </>
          )}

          {linked && (
            <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {linked} ya puede ver este San con su mismo usuario y
                contraseña.
              </p>
            </div>
          )}
        </form>
      )}

      {created && (
        <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Participante creado — turno
            {created.turnNumbers.length > 1 ? "s" : ""}{" "}
            {created.turnNumbers.map((t) => `#${t}`).join(", ")}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ring-slate-200">
            <div className="text-sm text-slate-700">
              <p>Usuario: {created.username}</p>
              <p className="font-mono text-base font-semibold text-emerald-700">
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
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Copiar credenciales"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
          <WhatsAppShareButton
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-base font-semibold text-white transition hover:bg-[#1ebe5a]"
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
