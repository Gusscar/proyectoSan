import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CredentialsTable, type CredentialRow } from "@/components/CredentialsTable";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: credentials } = await supabase
    .from("member_credentials")
    .select("*, sans(name), profiles(full_name)")
    .order("created_at", { ascending: false })
    .returns<CredentialRow[]>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            Credenciales temporales
          </h1>
          <p className="text-sm text-slate-500">
            Comparte estos accesos con cada participante.
          </p>
        </div>
        <Link
          href="/admin/create-san"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Nuevo San
        </Link>
      </div>

      <CredentialsTable rows={credentials ?? []} />
    </div>
  );
}
