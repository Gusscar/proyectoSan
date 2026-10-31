"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Formato es-CO: punto para miles, coma para decimales (50.000,00).

function sanitize(input: string): string {
  let cleaned = input.replace(/[^\d,]/g, "");
  const firstComma = cleaned.indexOf(",");
  if (firstComma !== -1) {
    const intPart = cleaned.slice(0, firstComma).replace(/,/g, "");
    const decPart = cleaned.slice(firstComma + 1).replace(/,/g, "").slice(0, 2);
    cleaned = `${intPart},${decPart}`;
  }
  return cleaned;
}

function group(intDigits: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatForDisplay(editValue: string): string {
  if (!editValue) return "";
  const [intPart, decPart] = editValue.split(",");
  const grouped = group(intPart || "0");
  return decPart !== undefined ? `${grouped},${decPart}` : grouped;
}

function toRawNumber(editValue: string): string {
  if (!editValue) return "";
  const [intPart, decPart] = editValue.split(",");
  const intDigits = intPart || "0";
  return decPart !== undefined ? `${intDigits}.${decPart}` : intDigits;
}

function fromRawNumber(raw: string): string {
  return raw.replace(".", ",");
}

export interface CurrencyInputProps {
  id?: string;
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  className,
  autoFocus,
}: CurrencyInputProps) {
  const [editValue, setEditValue] = useState(() => fromRawNumber(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setEditValue(fromRawNumber(value));
  }, [value, focused]);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      required={required}
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={focused ? editValue : formatForDisplay(editValue)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const cleaned = sanitize(e.target.value);
        setEditValue(cleaned);
        onChange(toRawNumber(cleaned));
      }}
      className={cn("input", className)}
    />
  );
}
