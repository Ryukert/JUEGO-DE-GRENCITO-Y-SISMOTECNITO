-- Ventana de editores: resultados de las encuestas de los juegos, ya resumidos.
-- Solo lectura y sin datos de quién contestó (ni alumno, ni grupo, ni ID): cuenta cuántas
-- respuestas hubo por juego, grado, día, carita y dificultad. Como registrar_encuesta, pide la
-- «llave de la API» (derivada de JUEGO_SECRETO) para que la llave publicable sola no la pueda usar.

create or replace function public.resumen_encuestas(
  p_llave text,
  p_desde date default null,
  p_hasta date default null
) returns table (
  juego text,
  tipo text,
  grado text,
  dia date,
  gusto smallint,
  dificultad smallint,
  respuestas bigint
)
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
    select e.juego, e.tipo, e.grado,
           (e.creado_en at time zone 'America/Tijuana')::date as dia,
           e.gusto, e.dificultad, count(*) as respuestas
    from public.encuestas e
    where (p_desde is null or (e.creado_en at time zone 'America/Tijuana')::date >= p_desde)
      and (p_hasta is null or (e.creado_en at time zone 'America/Tijuana')::date <= p_hasta)
    group by 1, 2, 3, 4, 5, 6
    order by 4, 1;
end;
$$;

revoke all on function public.resumen_encuestas(text, date, date) from public, authenticated;
grant execute on function public.resumen_encuestas(text, date, date) to anon;
