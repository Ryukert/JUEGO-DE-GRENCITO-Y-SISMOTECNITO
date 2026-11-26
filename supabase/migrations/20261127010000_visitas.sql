-- Contador de visitas del sitio: una fila por día (hora de Tijuana) con cuántas visitas hubo.
-- No se guarda nada de quién entró: ni IP, ni navegador, ni página. Cada navegador cuenta una
-- vez al día (lo decide la página); el servidor pone topes por IP para que nadie lo infle.
--
-- Igual que las opiniones: las funciones piden la «llave de la API» (derivada de JUEGO_SECRETO),
-- así sirven con la llave publicable o con la secreta.

create table if not exists public.visitas (
  dia     date primary key,
  visitas integer not null default 0 check (visitas >= 0)
);
alter table public.visitas enable row level security;   -- sin políticas: solo el servidor

-- Suma una visita a hoy y devuelve el total de siempre.
create or replace function public.sumar_visita(p_llave text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  esperado text;
  total bigint;
begin
  select l.hash into esperado from privado.llaves l where l.nombre = 'api';
  if esperado is null or encode(sha256(convert_to(coalesce(p_llave, ''), 'UTF8')), 'hex') <> esperado then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  insert into public.visitas as v (dia, visitas)
  values ((now() at time zone 'America/Tijuana')::date, 1)
  on conflict (dia) do update set visitas = v.visitas + 1;
  select coalesce(sum(visitas), 0) into total from public.visitas;
  return total;
end;
$$;

-- Visitas por día (para el contador de la portada y la administración).
create or replace function public.visitas_por_dia(p_llave text)
returns table (dia date, visitas integer)
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
  return query select v.dia, v.visitas from public.visitas v order by v.dia;
end;
$$;

revoke all on function public.sumar_visita(text) from public, authenticated;
revoke all on function public.visitas_por_dia(text) from public, authenticated;
grant execute on function public.sumar_visita(text) to anon, service_role;
grant execute on function public.visitas_por_dia(text) to anon, service_role;
