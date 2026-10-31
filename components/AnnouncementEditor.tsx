"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Megaphone, X } from "lucide-react";
import { updateAnnouncement } from "@/app/actions/san-actions";

export function AnnouncementEditor({
  sanId,
  currentAnnouncement,
}: {
  sanId: string;
  currentAnnouncement: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateAnnouncement(sanId, value);
      setValue("");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el aviso");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Megaphone className="h-4 w-4" />
        Aviso para los participantes
      </h2>

      {currentAnnouncement && !saved && (
        <p className="mb-3 rounded-lg bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
          Aviso actual: <span className="text-slate-300">{currentAnnouncement}</span>
        </p>
      )}

      {saved && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 ring-1 ring-inset ring-emerald-500/30">
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Aviso publicado y enviado a los participantes.
          </span>
          <button
            onClick={() => setSaved(false)}
            aria-label="Cerrar"
            className="text-emerald-400/70 hover:text-emerald-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="Escribe un mensaje visible para todos los participantes..."
        className="input resize-none"
      />

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

      <div className="mt-3">
        <button
          onClick={handleSave}
          disabled={saving || !value.trim()}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Publicar aviso
        </button>
      </div>
    </div>
  );
}
