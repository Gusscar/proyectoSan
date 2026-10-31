"use client";

import { useState } from "react";
import { KeyRound, Loader2, RotateCcw } from "lucide-react";
import type { MemberCredential, Profile, San } from "@/lib/supabase/types";

export type CredentialRow = MemberCredential & {
  sans: Pick<San, "name"> | null;
  profiles: Pick<Profile, "full_name"> | null;
};

export function CredentialsTable({ rows }: { rows: CredentialRow[] }) {
  const [data, setData] = useState(rows);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(row: CredentialRow) {
    setResettingId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.user_id, sanId: row.san_id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "No se pudo restablecer la contraseña");

      setData((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, temp_password: result.tempPassword } : r,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setResettingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      {error && (
        <p className="border-b border-slate-800 px-5 py-3 text-xs text-rose-400">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Participante</th>
              <th className="px-5 py-3 font-medium">San</th>
              <th className="px-5 py-3 font-medium">Usuario</th>
              <th className="px-5 py-3 font-medium">Contraseña</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {data.map((credential) => (
              <tr key={credential.id}>
                <td className="px-5 py-3 font-medium text-slate-100">
                  {credential.profiles?.full_name ?? "—"}
                </td>
                <td className="px-5 py-3 text-slate-400">
                  {credential.sans?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-slate-300">
                  {credential.username ?? credential.email ?? "—"}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 font-mono text-xs text-emerald-400 ring-1 ring-inset ring-slate-800">
                    <KeyRound className="h-3 w-3" />
                    {credential.temp_password}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleReset(credential)}
                    disabled={resettingId === credential.id}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {resettingId === credential.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Restablecer
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Aún no has creado participantes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
