import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CredentialsTable, type CredentialRow } from "@/components/CredentialsTable";
import { formatCurrency } from "@/lib/utils";
import type { San, SanMember } from "@/lib/supabase/types";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: sans }, { data: credentials }] = await Promise.all([
    supabase
      .from("sans")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .returns<San[]>(),
    supabase
      .from("member_credentials")
      .select("*, sans(name), profiles(full_name, phone)")
      .order("created_at", { ascending: false })
      .returns<CredentialRow[]>(),
  ]);

  const sanIds = (sans ?? []).map((s) => s.id);
  const { data: members } = sanIds.length
    ? await supabase
        .from("san_members")
        .select("san_id")
        .in("san_id", sanIds)
        .returns<Pick<SanMember, "san_id">[]>()
    : { data: [] as Pick<SanMember, "san_id">[] };

  const memberCounts = new Map<string, number>();
  for (const m of members ?? []) {
    memberCounts.set(m.san_id, (memberCounts.get(m.san_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Mis Sans</h1>
          <p className="text-sm text-slate-500">
            Gestiona turnos, abonos y participantes de cada San.
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

      <div className="grid gap-4 sm:grid-cols-2">
        {(sans ?? []).map((san) => (
          <Link
            key={san.id}
            href={`/admin/manage/${san.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900"
          >
            <div>
              <h2 className="font-semibold text-slate-100">{san.name}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {formatCurrency(san.contribution_amount)} · {san.total_turns}{" "}
                turnos
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3.5 w-3.5" />
                {memberCounts.get(san.id) ?? 0} participante
                {memberCounts.get(san.id) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-400">
              Gestionar
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}

        {(!sans || sans.length === 0) && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500 sm:col-span-2">
            Aún no has creado ningún San.{" "}
            <Link href="/admin/create-san" className="text-emerald-400">
              Crea el primero
            </Link>
            .
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-100">
          Credenciales temporales
        </h2>
        <CredentialsTable rows={credentials ?? []} />
      </div>
    </div>
  );
}
