-- SanApp: migración 0005 — permite que una misma persona tenga más de un
-- turno dentro del MISMO San (hasta ahora san_members solo admitía un turno
-- por usuario por San). Los abonos pasan a rastrearse por turno específico
-- (san_member_id), no por usuario, para que cada turno lleve su propio
-- historial de pagos sin mezclarse con los demás turnos de la misma persona.
-- Ejecutar una sola vez en el SQL Editor de tu proyecto Supabase.

-- 1. Eliminar el unique(san_id, user_id) de san_members: buscamos el nombre
--    real de la constraint en vez de asumirlo, por si el autogenerado no
--    coincide con la convención por defecto de Postgres.
do $$
declare
  c_name text;
begin
  select con.conname into c_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'san_members'
    and con.contype = 'u'
    and (
      select array_agg(attname::text order by attname::text)
      from unnest(con.conkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum
    ) = array['san_id', 'user_id'];

  if c_name is not null then
    execute format('alter table public.san_members drop constraint %I', c_name);
  end if;
end $$;

-- 2. payments pasa a referenciar el turno específico (san_members.id).
alter table public.payments
  add column if not exists san_member_id uuid references public.san_members(id) on delete cascade;

-- 3. Backfill: hoy cada (san_id, user_id) mapea a un único san_members.id,
--    así que esto es inequívoco.
update public.payments p
set san_member_id = sm.id
from public.san_members sm
where sm.san_id = p.san_id
  and sm.user_id = p.user_id
  and p.san_member_id is null;

alter table public.payments
  alter column san_member_id set not null;

-- 4. Reemplazar la unicidad de payments: antes por (san_id, user_id,
--    round_number), ahora por (san_member_id, round_number) — así cada
--    turno lleva su propio abono por periodo, aunque dos turnos sean de la
--    misma persona en el mismo San.
do $$
declare
  c_name text;
begin
  select con.conname into c_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'payments'
    and con.contype = 'u'
    and (
      select array_agg(attname::text order by attname::text)
      from unnest(con.conkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum
    ) = array['round_number', 'san_id', 'user_id'];

  if c_name is not null then
    execute format('alter table public.payments drop constraint %I', c_name);
  end if;
end $$;

alter table public.payments
  add constraint payments_san_member_id_round_number_key unique (san_member_id, round_number);

create index if not exists idx_payments_san_member_id on public.payments(san_member_id);
