-- Escuadrón Tecnito y Greencito: grupos, alumnos, progreso y respuestas.
--
-- El navegador NUNCA habla directo con estas tablas: todo pasa por las funciones de /api
-- con la llave secreta del servidor. Por eso RLS está activo sin políticas: con la llave
-- pública (anon) o la de un usuario no se puede leer ni escribir nada.
--
-- No se guardan datos personales: el alumno es un apodo + un avatar + un PIN (resumido).

create table public.grupos (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique check (codigo ~ '^[A-Z2-9]{6}$'),
  nombre        text not null check (char_length(nombre) between 1 and 60),
  grado         text not null check (grado in ('primaria', 'secundaria')),
  clave_maestro text not null,                  -- scrypt, nunca la clave tal cual
  creado_en     timestamptz not null default now()
);

create table public.alumnos (
  id            uuid primary key default gen_random_uuid(),
  grupo_id      uuid not null references public.grupos (id) on delete cascade,
  apodo         text not null check (char_length(apodo) between 2 and 20),
  apodo_normal  text not null,                  -- minúsculas y sin acentos: «Ana» = «ana» = «Aná»
  avatar        text not null default 'sismo' check (avatar in ('sismo', 'green')),
  pin           text not null,                  -- scrypt
  creado_en     timestamptz not null default now(),
  ultima_vez    timestamptz not null default now(),
  unique (grupo_id, apodo_normal)
);
create index alumnos_grupo_idx on public.alumnos (grupo_id);

create table public.progreso (
  alumno_id      uuid primary key references public.alumnos (id) on delete cascade,
  datos          jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);

create table public.respuestas (
  id         bigint generated always as identity primary key,
  alumno_id  uuid not null references public.alumnos (id) on delete cascade,
  grupo_id   uuid not null references public.grupos (id) on delete cascade,
  personaje  text not null check (personaje in ('sismo', 'green')),
  mision     text not null check (char_length(mision) <= 10),
  bono       boolean not null default false,
  correcta   boolean not null,
  sin_tiempo boolean not null default false,
  creado_en  timestamptz not null default now()
);
create index respuestas_grupo_idx on public.respuestas (grupo_id);
create index respuestas_alumno_idx on public.respuestas (alumno_id);

alter table public.grupos     enable row level security;
alter table public.alumnos    enable row level security;
alter table public.progreso   enable row level security;
alter table public.respuestas enable row level security;

revoke all on public.grupos, public.alumnos, public.progreso, public.respuestas from anon, authenticated;
