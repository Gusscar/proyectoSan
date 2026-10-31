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
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <HandCoins className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">SanApp</h1>
        <p className="text-base text-slate-600">
          Inicia sesión con el usuario y la clave asignados por tu
          administrador.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="identifier" className="mb-1.5 block text-base font-medium text-slate-700">
            Usuario o correo
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="identifier"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-lg border-2 border-slate-300 bg-white py-3.5 pl-11 pr-3 text-base text-slate-900 outline-none ring-emerald-500/40 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2"
              placeholder="tu usuario"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-base font-medium text-slate-700"
          >
            Contraseña
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border-2 border-slate-300 bg-white py-3.5 pl-11 pr-3 text-base text-slate-900 outline-none ring-emerald-500/40 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-100 px-3 py-2.5 text-base font-medium text-rose-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
