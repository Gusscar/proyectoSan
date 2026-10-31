import { Megaphone } from "lucide-react";

export function AnnouncementBanner({ announcement }: { announcement: string }) {
  if (!announcement.trim()) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
      <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
      <div>
        <p className="text-sm font-medium text-indigo-300">
          Aviso del administrador
        </p>
        <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-300">
          {announcement}
        </p>
      </div>
    </div>
  );
}
