"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Loader2, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolveLoginIdentifier } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: resolveLoginIdentifier(identifier),
      password,
    });

    if (signInError) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/20">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <HandCoins className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-slate-100">SanApp</h1>
        <p className="text-sm text-slate-400">
          Inicia sesión con el usuario y la clave asignados por tu
          administrador.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="mb-1.5 block text-sm text-slate-300">
            Usuario o correo
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="identifier"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none ring-emerald-500/50 placeholder:text-slate-600 focus:ring-2"
              placeholder="tu usuario"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm text-slate-300"
          >
            Contraseña
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none ring-emerald-500/50 placeholder:text-slate-600 focus:ring-2"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
