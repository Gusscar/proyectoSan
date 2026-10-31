"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { updateAnnouncement } from "@/app/actions/san-actions";

export function AnnouncementEditor({
  sanId,
  initialAnnouncement,
}: {
  sanId: string;
  initialAnnouncement: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialAnnouncement);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateAnnouncement(sanId, value);
      setSaved(true);
      router.refresh();
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
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-400 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Publicar aviso
        </button>
        {saved && (
          <span className="text-xs text-emerald-400">Guardado</span>
        )}
      </div>
    </div>
  );
}
