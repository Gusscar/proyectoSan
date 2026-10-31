import Link from "next/link";
import { HandCoins, LogOut, Shield } from "lucide-react";
import { signOut } from "@/app/actions/auth-actions";

export function Navbar({
  fullName,
  isAdmin,
}: {
  fullName: string;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <HandCoins className="h-4.5 w-4.5" />
          </div>
          <span className="font-semibold text-slate-100">SanApp</span>
        </Link>

        <nav className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-900"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <span className="hidden text-sm text-slate-400 sm:inline">
            {fullName}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
