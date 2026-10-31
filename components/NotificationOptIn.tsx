"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { subscribeToPush } from "@/app/actions/push-actions";

const DISMISSED_KEY = "sanapp_push_dismissed_at";
const DISMISS_DAYS = 14;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function wasRecentlyDismissed() {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

export function NotificationOptIn() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!supported) return;
    if (Notification.permission !== "default") return;
    if (wasRecentlyDismissed()) return;

    // Pequeño retraso para no pisar el banner de instalación de PWA, que
    // también aparece al llegar por primera vez.
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  async function enable() {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      await subscribeToPush({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });

      setVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl shadow-black/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <Bell className="h-5 w-5" />
        </div>

        <div className="flex-1 text-sm">
          <p className="font-medium text-slate-100">Activa notificaciones</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {error ?? "Entérate al instante de nuevos avisos del San."}
          </p>
        </div>

        <button
          onClick={enable}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-400 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Activar
        </button>

        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
