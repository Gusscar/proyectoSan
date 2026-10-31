-- SanApp: migración 0002 — login por usuario (sin correo obligatorio) +
-- base para que el admin pueda restablecer contraseñas.
-- Ejecutar una sola vez en el SQL Editor de tu proyecto Supabase.

-- ============================================================
-- 1. Columna `username` en profiles (identificador de login)
-- ============================================================
alter table public.profiles
  add column if not exists username text unique;

-- ============================================================
-- 2. member_credentials: username en vez de correo obligatorio
-- ============================================================
alter table public.member_credentials
  add column if not exists username text;

alter table public.member_credentials
  alter column email drop not null;

-- ============================================================
-- 3. Trigger actualizado: copiar username desde user_metadata
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- El trigger ya existe (on_auth_user_created); solo se reemplaza la función
-- que ejecuta, no hace falta recrear el trigger en sí.
