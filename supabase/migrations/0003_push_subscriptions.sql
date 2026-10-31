-- SanApp: migración 0003 — notificaciones push para avisos.
-- Ejecutar una sola vez en el SQL Editor de tu proyecto Supabase.

create table if not exists public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.push_subscriptions enable row level security;

-- Cada usuario administra solo sus propias suscripciones (se crean/borran
-- desde el navegador al activar/desactivar notificaciones). El envío de
-- push en sí lo hace el backend con la Service Role Key, que no pasa
-- por RLS, así que no hace falta una política de SELECT para `authenticated`.
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions(user_id);
