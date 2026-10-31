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
          <h1 className="text-xl font-bold text-slate-900">Mis Sans</h1>
          <p className="text-base text-slate-600">
            Gestiona turnos, abonos y participantes de cada San.
          </p>
        </div>
        <Link
          href="/admin/create-san"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-5 w-5" />
          Nuevo San
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(sans ?? []).map((san) => (
          <Link
            key={san.id}
            href={`/admin/manage/${san.id}`}
            className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">{san.name}</h2>
              <p className="mt-1 text-base text-slate-700">
                {formatCurrency(san.contribution_amount)} · {san.total_turns}{" "}
                turnos
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                {memberCounts.get(san.id) ?? 0} participante
                {memberCounts.get(san.id) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-base font-semibold text-emerald-700">
              Gestionar
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}

        {(!sans || sans.length === 0) && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-base text-slate-600 sm:col-span-2">
            Aún no has creado ningún San.{" "}
            <Link href="/admin/create-san" className="font-semibold text-emerald-700">
              Crea el primero
            </Link>
            .
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Credenciales temporales
        </h2>
        <CredentialsTable rows={credentials ?? []} />
      </div>
    </div>
  );
}
