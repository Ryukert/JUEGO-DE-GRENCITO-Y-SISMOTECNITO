-- Evaluación abierta por evento: /opinion?evento=feria-de-ciencias guarda el nombre del evento
-- con cada opinión, para ver y reportar cada feria, visita o taller por separado.
-- Sin evento (null) es la evaluación general, como hasta ahora.

alter table public.opiniones add column if not exists evento text
  check (evento is null or (length(evento) <= 40 and evento ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));
create index if not exists opiniones_evento_idx on public.opiniones (evento, creado_en);

-- registrar_opinion: un parámetro más (opcional). Se cambia la firma: se borra la de antes.
drop function if exists public.registrar_opinion(text, integer, integer, integer, text);
create or replace function public.registrar_opinion(
  p_llave text, p_juego integer, p_trato integer, p_explicacion integer,
  p_quien text default null, p_evento text default null
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
  insert into public.opiniones (juego, trato, explicacion, quien, evento)
  values (p_juego::smallint, p_trato::smallint, p_explicacion::smallint, p_quien, p_evento);
  return true;
end;
$$;

-- resumen_opiniones: ahora también agrupa por evento (cambia lo que devuelve: se borra la de antes).
drop function if exists public.resumen_opiniones(text, date, date);
create or replace function public.resumen_opiniones(p_llave text, p_desde date default null, p_hasta date default null)
returns table (dia date, evento text, quien text, juego smallint, trato smallint, explicacion smallint, respuestas bigint)
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
    select (o.creado_en at time zone 'America/Tijuana')::date, o.evento, o.quien, o.juego, o.trato, o.explicacion, count(*)
    from public.opiniones o
    where (p_desde is null or (o.creado_en at time zone 'America/Tijuana')::date >= p_desde)
      and (p_hasta is null or (o.creado_en at time zone 'America/Tijuana')::date <= p_hasta)
    group by 1, 2, 3, 4, 5, 6
    order by 1;
end;
$$;

revoke all on function public.registrar_opinion(text, integer, integer, integer, text, text) from public, authenticated;
revoke all on function public.resumen_opiniones(text, date, date) from public, authenticated;
grant execute on function public.registrar_opinion(text, integer, integer, integer, text, text) to anon, service_role;
grant execute on function public.resumen_opiniones(text, date, date) to anon, service_role;
