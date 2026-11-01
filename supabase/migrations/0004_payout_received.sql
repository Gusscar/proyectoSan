-- SanApp: migración 0004 — marca manual de entrega del pozo por turno.
-- Ejecutar una sola vez en el SQL Editor de tu proyecto Supabase.

alter table public.san_members
  add column if not exists payout_received boolean not null default false;

-- La política "san_members_update_admin" ya existente cubre esta columna:
-- solo el admin dueño del San puede actualizar san_members.
