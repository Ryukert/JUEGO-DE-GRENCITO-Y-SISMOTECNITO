-- Los alumnos evalúan a su maestro con caritas (1 = 😡 rojo … 5 = 😄 verde).
-- Una evaluación por alumno al día (si la repite, se actualiza). El maestro solo ve promedios
-- y conteos, nunca quién votó qué. Sin texto libre: nada de datos personales.

create table public.evaluaciones (
  id         bigint generated always as identity primary key,
  grupo_id   uuid not null references public.grupos (id) on delete cascade,
  alumno_id  uuid not null references public.alumnos (id) on delete cascade,
  fecha      date not null default current_date,
  explica    smallint not null check (explica between 1 and 5),
  divierte   smallint not null check (divierte between 1 and 5),
  aprendo    smallint not null check (aprendo between 1 and 5),
  creado_en  timestamptz not null default now(),
  unique (alumno_id, fecha)
);
create index evaluaciones_grupo_idx on public.evaluaciones (grupo_id, fecha);

alter table public.evaluaciones enable row level security;
revoke all on public.evaluaciones from anon, authenticated;
