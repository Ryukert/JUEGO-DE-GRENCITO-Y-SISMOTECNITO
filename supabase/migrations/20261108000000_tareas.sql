-- Tarea del maestro: una por grupo, con hasta 5 minijuegos del Centro y una nota corta.
--
-- Igual que las demás tablas: el navegador nunca la toca. La escribe y la lee api/grupo.js
-- (pase de maestro) y la lee api/progreso.js / api/alumno.js (pase de alumno), con la llave
-- secreta del servidor. RLS activo sin políticas y sin permisos para anon ni authenticated.
--
-- Un alumno cumplió la tarea cuando jugó cada minijuego después de `desde`
-- (progreso.datos.juegos[id].jugadoEn). Al cambiar la tarea, `desde` vuelve a empezar.

create table public.tareas (
  grupo_id uuid primary key references public.grupos (id) on delete cascade,
  juegos   text[] not null check (cardinality(juegos) between 1 and 5),
  nota     text not null default '' check (char_length(nota) <= 140),
  desde    timestamptz not null default now()
);

alter table public.tareas enable row level security;
revoke all on public.tareas from anon, authenticated;
