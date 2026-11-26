-- Evaluación abierta (/opinion): cualquiera califica el juego, el trato y la explicación con
-- caritas (1 = 😡 … 5 = 😄), sin cuenta. No se guarda nada de quién contestó: ni IP, ni alumno,
-- ni grupo; solo el «soy…» opcional (alumno, maestro, familia u otro).
--
-- Igual que las encuestas: con la llave secreta el servidor escribe directo en la tabla; con la
-- publicable usa estas funciones, que piden la «llave de la API» (derivada de JUEGO_SECRETO).

create table if not exists public.opiniones (
  id          bigint generated always as identity primary key,
  juego       smallint not null check (juego between 1 and 5),
  trato       smallint not null check (trato between 1 and 5),
  explicacion smallint not null check (explicacion between 1 and 5),
  quien       text check (quien in ('alumno', 'maestro', 'familia', 'otro')),
  creado_en   timestamptz not null default now()
);
alter table public.opiniones enable row level security;   -- sin políticas: solo el servidor
create index if not exists opiniones_creado_idx on public.opiniones (creado_en);

create or replace function public.registrar_opinion(
  p_llave text, p_juego integer, p_trato integer, p_explicacion integer, p_quien text default null
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  esperado text;
begin
  select l.hash into esperado from privado.llaves l where l.nombre = 'api';
  if esperado is null or encode(sha256(convert_to(coalesce(p_llave, ''), 'UTF8')), 'hex') <> esperado then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  -- las restricciones de la tabla revisan los valores
  insert into public.opiniones (juego, trato, explicacion, quien)
  values (p_juego::smallint, p_trato::smallint, p_explicacion::smallint, p_quien);
  return true;
end;
$$;

-- Resumen para la administración: cuántas opiniones por día, «soy…» y caritas.
create or replace function public.resumen_opiniones(p_llave text, p_desde date default null, p_hasta date default null)
returns table (dia date, quien text, juego smallint, trato smallint, explicacion smallint, respuestas bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  esperado text;
begin
  select l.hash into esperado from privado.llaves l where l.nombre = 'api';
  if esperado is null or encode(sha256(convert_to(coalesce(p_llave, ''), 'UTF8')), 'hex') <> esperado then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return query
    select (o.creado_en at time zone 'America/Tijuana')::date, o.quien, o.juego, o.trato, o.explicacion, count(*)
    from public.opiniones o
    where (p_desde is null or (o.creado_en at time zone 'America/Tijuana')::date >= p_desde)
      and (p_hasta is null or (o.creado_en at time zone 'America/Tijuana')::date <= p_hasta)
    group by 1, 2, 3, 4, 5
    order by 1;
end;
$$;

revoke all on function public.registrar_opinion(text, integer, integer, integer, text) from public, authenticated;
revoke all on function public.resumen_opiniones(text, date, date) from public, authenticated;
grant execute on function public.registrar_opinion(text, integer, integer, integer, text) to anon, service_role;
grant execute on function public.resumen_opiniones(text, date, date) to anon, service_role;
