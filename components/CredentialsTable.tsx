"use client";

import { useState } from "react";
import { KeyRound, Loader2, RotateCcw } from "lucide-react";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import type { MemberCredential, Profile, San } from "@/lib/supabase/types";

export type CredentialRow = MemberCredential & {
  sans: Pick<San, "name"> | null;
  profiles: Pick<Profile, "full_name" | "phone"> | null;
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error && (
        <p className="border-b border-slate-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Participante</th>
              <th className="px-5 py-3">San</th>
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Contraseña</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((credential) => (
              <tr key={credential.id}>
                <td className="px-5 py-3 font-medium text-slate-900">
                  {credential.profiles?.full_name ?? "—"}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {credential.sans?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-slate-700">
                  {credential.username ?? credential.email ?? "—"}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 font-mono text-sm font-semibold text-emerald-800 ring-2 ring-inset ring-emerald-200">
                    <KeyRound className="h-3.5 w-3.5" />
                    {credential.temp_password}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReset(credential)}
                      disabled={resettingId === credential.id}
                      className="flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      {resettingId === credential.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Restablecer
                    </button>
                    <WhatsAppShareButton
                      phone={credential.profiles?.phone}
                      fullName={credential.profiles?.full_name ?? ""}
                      username={credential.username ?? credential.email ?? ""}
                      password={credential.temp_password}
                    />
                  </div>
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
