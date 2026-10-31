import { Megaphone } from "lucide-react";

export function AnnouncementBanner({ announcement }: { announcement: string }) {
  if (!announcement.trim()) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border-2 border-indigo-300 bg-indigo-50 p-4">
      <Megaphone className="mt-0.5 h-6 w-6 shrink-0 text-indigo-700" />
      <div>
        <p className="text-base font-semibold text-indigo-800">
          Aviso del administrador
        </p>
        <p className="mt-0.5 whitespace-pre-wrap text-base text-slate-800">
          {announcement}
        </p>
      </div>
    </div>
  );
}
