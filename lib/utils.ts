import type { Frequency, Payment, PaymentStatus } from "./supabase/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));
}

const USERNAME_EMAIL_DOMAIN = "sanapp.local";

/** Normaliza un nombre de usuario: minúsculas, solo [a-z0-9._-]. */
export function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export function isValidUsername(username: string) {
  const normalized = normalizeUsername(username);
  return normalized.length >= 3 && normalized.length <= 30 && normalized === username.trim().toLowerCase();
}

/**
 * Supabase Auth requiere un correo. Los participantes solo necesitan
 * usuario + contraseña, así que generamos un correo sintético estable
 * a partir del username (verificado: Supabase acepta y autentica
 * direcciones @sanapp.local sin problema).
 */
export function usernameToEmail(username: string) {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;
}

/**
 * En el login aceptamos "usuario" (participantes) o correo real (admins
 * creados antes de este cambio). Si el texto tiene "@" se usa tal cual;
 * si no, se traduce al correo sintético con la MISMA normalización que
 * usernameToEmail, para que login y creación coincidan byte a byte.
 */
export function resolveLoginIdentifier(input: string) {
  const trimmed = input.trim();
  return trimmed.includes("@") ? trimmed : usernameToEmail(trimmed);
}

const FREQUENCY_DAYS: Record<Frequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

/**
 * Calcula la ronda/periodo actual del San a partir de la fecha de inicio.
 * El resultado se limita a `totalTurns` para no exceder la duración del San.
 */
export function getCurrentRound(
  startDate: string,
  frequency: Frequency,
  totalTurns: number,
  now: Date = new Date(),
) {
  const start = new Date(startDate);
  const diffDays = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const elapsed = Math.floor(diffDays / FREQUENCY_DAYS[frequency]) + 1;
  return Math.min(Math.max(elapsed, 1), totalTurns);
}

/** Calcula la fecha de pago para un turno (0 = primer turno) a partir del inicio del San. */
export function computePayoutDate(
  startDate: string,
  frequency: Frequency,
  turnIndexZeroBased: number,
) {
  const date = new Date(startDate);
  date.setUTCDate(date.getUTCDate() + FREQUENCY_DAYS[frequency] * turnIndexZeroBased);
  return date.toISOString().slice(0, 10);
}

export function getPaymentStatus(
  payment: Payment | null,
  contributionAmount: number,
): PaymentStatus {
  if (!payment || payment.amount_paid <= 0) return "pendiente";
  if (payment.is_complete || payment.amount_paid >= contributionAmount) {
    return "al-dia";
  }
  return "incompleto";
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  "al-dia": "Al día",
  incompleto: "Incompleto",
  pendiente: "Pendiente",
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  "al-dia": "bg-emerald-100 text-emerald-800 ring-emerald-600",
  incompleto: "bg-amber-100 text-amber-800 ring-amber-600",
  pendiente: "bg-rose-100 text-rose-800 ring-rose-600",
};

/** Versión sólida y vívida para indicadores pequeños (puntos de estado). */
export const PAYMENT_STATUS_DOT_COLOR: Record<PaymentStatus, string> = {
  "al-dia": "bg-emerald-600 ring-emerald-800",
  incompleto: "bg-amber-500 ring-amber-700",
  pendiente: "bg-rose-600 ring-rose-800",
};

/** Genera una contraseña temporal aleatoria y segura (no es un patrón adivinable). */
export function generateTempPassword(length = 12) {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => charset[byte % charset.length]).join("");
}
