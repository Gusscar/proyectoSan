"use client";

import { useEffect, useState } from "react";

interface WhatsAppShareButtonProps {
  phone?: string | null;
  fullName: string;
  username: string;
  password: string;
  className?: string;
  label?: string;
}

export function WhatsAppShareButton({
  phone,
  fullName,
  username,
  password,
  className,
  label,
}: WhatsAppShareButtonProps) {
  // `window.location.origin` no existe durante el render del servidor ni en
  // el primer render de hidratación; se resuelve en un efecto (solo-cliente)
  // para no hornear un origin vacío en el href.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const message = `¡Hola ${fullName}! Tus datos de acceso a SanApp:\n\nIngresa aquí: ${origin}/login\nUsuario: ${username}\nContraseña: ${password}`;
  const cleanedPhone = phone?.replace(/\D/g, "");
  const href = `https://wa.me/${cleanedPhone || ""}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Compartir por WhatsApp"
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#25D366] ring-1 ring-inset ring-[#25D366]/30 transition hover:bg-[#25D366]/20"
      }
    >
      <WhatsAppIcon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.89 4.43-9.89 9.89 0 1.74.46 3.44 1.32 4.94L2 22l5.29-1.39c1.44.79 3.07 1.2 4.72 1.2h.01c5.46 0 9.89-4.43 9.89-9.89 0-2.64-1.03-5.12-2.9-6.98A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.23 8.23 0 0 1 2.42 5.81c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23zm-4.6 4.3c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.67 2.55 4.05 3.57.57.24 1.01.39 1.36.5.57.18 1.09.15 1.5.09.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41h-.46z" />
    </svg>
  );
}
