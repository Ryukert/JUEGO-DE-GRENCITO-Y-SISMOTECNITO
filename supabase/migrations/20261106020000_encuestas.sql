-- Encuestas de satisfacción de los juegos: al terminar un minijuego o una partida de misiones.
--   gusto:      1 = 😡 … 5 = 😄  (¿te gustó?)
--   dificultad: 1 = 😴 muy fácil, 2 = 👌 justo, 3 = 😰 muy difícil
-- Se puede contestar sin cuenta. Si el alumno está en un grupo, se liga para el panel del maestro
-- (el maestro solo ve promedios por juego, nunca quién contestó).

create table public.encuestas (
  id         bigint generated always as identity primary key,
  juego      text not null check (juego ~ '^[a-z0-9-]{1,40}$'),
  tipo       text not null check (tipo in ('minijuego', 'mision')),
  gusto      smallint not null check (gusto between 1 and 5),
  dificultad smallint not null check (dificultad between 1 and 3),
  grado      text check (grado in ('primaria', 'secundaria')),
  grupo_id   uuid references public.grupos (id) on delete set null,
  alumno_id  uuid references public.alumnos (id) on delete set null,
  creado_en  timestamptz not null default now()
);
create index encuestas_juego_idx on public.encuestas (juego);
create index encuestas_grupo_idx on public.encuestas (grupo_id);

alter table public.encuestas enable row level security;
revoke all on public.encuestas from anon, authenticated;

-- Resumen por juego para revisarlo en el panel de Supabase (Table Editor → encuestas_por_juego).
create view public.encuestas_por_juego with (security_invoker = true) as
select
  juego,
  tipo,
  count(*)                                              as respuestas,
  round(avg(gusto)::numeric, 2)                         as gusto_promedio,
  round(100.0 * count(*) filter (where dificultad = 1) / count(*)) as pct_muy_facil,
  round(100.0 * count(*) filter (where dificultad = 2) / count(*)) as pct_justo,
  round(100.0 * count(*) filter (where dificultad = 3) / count(*)) as pct_muy_dificil,
  max(creado_en)                                        as ultima
from public.encuestas
group by juego, tipo;

revoke all on public.encuestas_por_juego from anon, authenticated;
