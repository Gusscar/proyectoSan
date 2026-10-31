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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <HandCoins className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">SanApp</span>
        </Link>

        <nav className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-base font-medium text-indigo-700 transition hover:bg-indigo-50"
            >
              <Shield className="h-5 w-5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <span className="hidden text-base text-slate-600 sm:inline">
            {fullName}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-base font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
