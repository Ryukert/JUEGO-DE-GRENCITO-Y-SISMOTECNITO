-- Encuestas sin la llave secreta: el servidor (api/encuesta.js) puede guardar encuestas con la
-- llave PUBLICABLE llamando a esta función, pero solo si manda la «llave de la API», que deriva
-- de JUEGO_SECRETO y nunca sale del servidor. Aquí solo se guarda su resumen sha256, en un
-- esquema que la API de Supabase no expone.
--
-- Después de correr esta migración, guarda el resumen (lo calcula el README, «Encuestas sin
-- llave secreta»):
--   insert into privado.llaves (nombre, hash) values ('api', '<sha256 hex>')
--   on conflict (nombre) do update set hash = excluded.hash;

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table if not exists privado.llaves (
  nombre text primary key,
  hash   text not null
);
revoke all on privado.llaves from public, anon, authenticated;

create or replace function public.registrar_encuesta(
  p_llave text,
  p_juego text,
  p_tipo text,
  p_gusto integer,
  p_dificultad integer,
  p_grado text default null,
  p_alumno uuid default null,
  p_grupo uuid default null
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  esperado text;
begin
  select hash into esperado from privado.llaves where nombre = 'api';
  if esperado is null or encode(sha256(convert_to(coalesce(p_llave, ''), 'UTF8')), 'hex') <> esperado then
    raise exception 'sin permiso' using errcode = '42501';
  end if;

  -- solo se liga al grupo si el alumno de verdad está en ese grupo
  if p_alumno is null or p_grupo is null
     or not exists (select 1 from public.alumnos a where a.id = p_alumno and a.grupo_id = p_grupo) then
    p_alumno := null;
    p_grupo := null;
  end if;

  -- las restricciones de la tabla revisan juego, tipo, gusto, dificultad y grado
  insert into public.encuestas (juego, tipo, gusto, dificultad, grado, grupo_id, alumno_id)
  values (p_juego, p_tipo, p_gusto::smallint, p_dificultad::smallint,
          case when p_grado in ('primaria', 'secundaria') then p_grado end, p_grupo, p_alumno);
  return true;
end;
$$;

revoke all on function public.registrar_encuesta(text, text, text, integer, integer, text, uuid, uuid) from public, authenticated;
grant execute on function public.registrar_encuesta(text, text, text, integer, integer, text, uuid, uuid) to anon;
