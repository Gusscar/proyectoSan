"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISSED_KEY = "sanapp_install_dismissed_at";
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function wasRecentlyDismissed() {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone || wasRecentlyDismissed()) return;

    const iOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    setIsIOS(iOS);
    if (iOS) setVisible(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Download className="h-6 w-6" />
        </div>

        <div className="flex-1 text-sm">
          <p className="text-base font-semibold text-slate-900">Instala SanApp</p>
          {isIOS ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
              Toca <Share className="h-4 w-4" /> y luego &quot;Agregar a
              inicio&quot;
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-600">
              Accede más rápido desde tu pantalla de inicio.
            </p>
          )}
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={install}
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Instalar
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
