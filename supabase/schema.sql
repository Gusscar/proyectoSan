-- SanApp: esquema completo de base de datos para Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase (una sola vez, sobre una base limpia).

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABLA DE PERFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default '',
  username text unique,
  phone text,
  role text not null check (role in ('admin', 'member')) default 'member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 2. TABLA DEL SAN (Grupos de ahorro)
-- ============================================================
create table public.sans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contribution_amount numeric(12,2) not null check (contribution_amount > 0),
  frequency text not null default 'monthly' check (frequency in ('weekly', 'biweekly', 'monthly')),
  start_date date not null,
  total_turns integer not null check (total_turns > 0),
  announcement text not null default '',
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 3. TABLA PIVOTE: MIEMBROS Y TURNOS
-- ============================================================
create table public.san_members (
  id uuid default uuid_generate_v4() primary key,
  san_id uuid references public.sans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  turn_number integer not null check (turn_number > 0),
  payout_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (san_id, turn_number),
  unique (san_id, user_id)
);

-- ============================================================
-- 4. TABLA DE PAGOS / ABONOS
-- ============================================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  san_id uuid references public.sans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  round_number integer not null check (round_number > 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  is_complete boolean not null default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (san_id, user_id, round_number)
);

-- ============================================================
-- 5. TABLA DE CREDENCIALES TEMPORALES (solo administrador)
-- ============================================================
-- Separada de san_members a propósito: la contraseña temporal es un dato
-- sensible y san_members se lee por TODOS los miembros del San para la
-- tabla de transparencia. Mantenerla en una tabla aparte con RLS propia
-- evita que cualquier miembro pueda leer la clave de otro participante.
create table public.member_credentials (
  id uuid default uuid_generate_v4() primary key,
  san_id uuid references public.sans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  username text,
  email text,
  temp_password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (san_id, user_id)
);

-- ============================================================
-- FUNCIONES AUXILIARES (SECURITY DEFINER)
-- ============================================================
-- Se usan `security definer` para evitar "infinite recursion detected in
-- policy": una política de san_members que consultara san_members de forma
-- directa (vía EXISTS) sería auto-referencial. Al envolver la consulta en
-- una función `security definer`, esta se ejecuta con los privilegios del
-- dueño de la función (bypassa RLS), y la política solo evalúa el booleano
-- resultante.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_san_member(p_san_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.san_members
    where san_id = p_san_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_san_admin(p_san_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.sans
    where id = p_san_id and created_by = auth.uid()
  );
$$;

-- ============================================================
-- RPC: reordenar turnos de forma atómica
-- ============================================================
-- san_members tiene unique(san_id, turn_number): reasignar turnos en dos
-- updates directos desde el cliente puede chocar con esa restricción a
-- mitad de camino (p. ej. intercambiar turno 1 <-> 2). Esta función hace
-- el reacomodo en dos fases (valores negativos temporales y luego los
-- definitivos) dentro de una sola transacción.
create or replace function public.reorder_san_members(
  p_san_id uuid,
  p_members jsonb -- [{ "id": uuid, "turn_number": int, "payout_date": date }, ...]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  m record;
begin
  if not public.is_san_admin(p_san_id) then
    raise exception 'No autorizado para reordenar este San';
  end if;

  for m in
    select * from jsonb_to_recordset(p_members)
      as x(id uuid, turn_number int, payout_date date)
  loop
    update public.san_members
    set turn_number = -m.turn_number
    where id = m.id and san_id = p_san_id;
  end loop;

  for m in
    select * from jsonb_to_recordset(p_members)
      as x(id uuid, turn_number int, payout_date date)
  loop
    update public.san_members
    set turn_number = m.turn_number, payout_date = m.payout_date
    where id = m.id and san_id = p_san_id;
  end loop;
end;
$$;

-- ============================================================
-- TRIGGER: crear perfil automáticamente al crear un usuario en Auth
-- ============================================================
-- Cubre tanto los usuarios creados por el admin (API con Service Role)
-- como cualquier alta futura vía Supabase Auth.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- HABILITAR RLS (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.sans enable row level security;
alter table public.san_members enable row level security;
alter table public.payments enable row level security;
alter table public.member_credentials enable row level security;

-- ============================================================
-- POLÍTICAS: profiles
-- ============================================================
-- Lectura abierta a cualquier usuario autenticado: la tabla de
-- transparencia necesita mostrar el nombre de todos los participantes.
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- El rol no se puede cambiar desde el cliente, ni siquiera el propio
-- usuario: solo columnas concretas son modificables vía RLS + grants.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- ============================================================
-- POLÍTICAS: sans
-- ============================================================
create policy "sans_select_members_and_admin" on public.sans
  for select using (
    created_by = auth.uid() or public.is_san_member(id)
  );

create policy "sans_insert_admin_only" on public.sans
  for insert with check (
    public.is_admin() and created_by = auth.uid()
  );

create policy "sans_update_owner" on public.sans
  for update using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "sans_delete_owner" on public.sans
  for delete using (created_by = auth.uid());

-- ============================================================
-- POLÍTICAS: san_members (tabla de transparencia de turnos)
-- ============================================================
create policy "san_members_select_visible" on public.san_members
  for select using (
    public.is_san_admin(san_id) or public.is_san_member(san_id)
  );

create policy "san_members_insert_admin" on public.san_members
  for insert with check (public.is_san_admin(san_id));

create policy "san_members_update_admin" on public.san_members
  for update using (public.is_san_admin(san_id))
  with check (public.is_san_admin(san_id));

create policy "san_members_delete_admin" on public.san_members
  for delete using (public.is_san_admin(san_id));

-- ============================================================
-- POLÍTICAS: payments (tabla de transparencia de abonos)
-- ============================================================
create policy "payments_select_visible" on public.payments
  for select using (
    public.is_san_admin(san_id) or public.is_san_member(san_id)
  );

create policy "payments_admin_manages_all" on public.payments
  for all using (public.is_san_admin(san_id))
  with check (public.is_san_admin(san_id));

-- ============================================================
-- POLÍTICAS: member_credentials (solo el admin dueño del San)
-- ============================================================
create policy "member_credentials_select_admin" on public.member_credentials
  for select using (public.is_san_admin(san_id));

-- No se define política de INSERT/UPDATE/DELETE para `authenticated`:
-- esta tabla solo se escribe desde el backend con la Service Role Key,
-- que no pasa por RLS. Queda denegado por defecto para cualquier cliente.

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_san_members_san_id on public.san_members(san_id);
create index idx_san_members_user_id on public.san_members(user_id);
create index idx_payments_san_id on public.payments(san_id);
create index idx_payments_user_id on public.payments(user_id);
create index idx_member_credentials_san_id on public.member_credentials(san_id);

-- ============================================================
-- BOOTSTRAP: primer administrador
-- ============================================================
-- No existe un flujo de auto-registro: el primer admin se crea una vez,
-- manualmente, desde Supabase Studio > Authentication > Add user, y
-- luego se promueve con:
--
--   update public.profiles set role = 'admin' where id = '<uuid-del-usuario>';
--
-- A partir de ahí, ese admin usa el panel para crear San y participantes.
