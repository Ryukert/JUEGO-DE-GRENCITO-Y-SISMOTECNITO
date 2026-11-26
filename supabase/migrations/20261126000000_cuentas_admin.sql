-- Cuentas de administración desde la página (solo el superusuario).
--
-- El servidor (api/editores.js) llama a estas funciones con la llave publicable y la «llave de
-- la API» (derivada de JUEGO_SECRETO), igual que resumen_encuestas. Además, cada función revisa
-- en auth.users que quien la pide (p_quien) SIGUE siendo superusuario: si le quitan el rol, el
-- pase de 8 horas que ya tenía deja de servir para esto en ese momento.
--
-- Roles (auth.users.raw_app_meta_data->>'rol'):
--   sin rol        entra si su correo es institucional (src/data/institucion.js)
--   admin          entra aunque su correo no sea institucional
--   superusuario   lo mismo, y además administra las cuentas
--   bloqueado      no entra
-- Nadie se cambia el rol ni se bloquea a sí mismo, así que siempre queda un superusuario.

create schema if not exists privado;

create or replace function privado.revisar_superusuario(p_llave text, p_quien uuid)
returns void
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
  if not exists (
    select 1 from auth.users u
    where u.id = p_quien and u.raw_app_meta_data->>'rol' = 'superusuario' and u.email_confirmed_at is not null
  ) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
end;
$$;
revoke all on function privado.revisar_superusuario(text, uuid) from public, anon, authenticated;

-- Lista de cuentas
create or replace function public.admin_cuentas(p_llave text, p_quien uuid)
returns table (id uuid, correo text, confirmado boolean, rol text, creado_en timestamptz, ultimo_acceso timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform privado.revisar_superusuario(p_llave, p_quien);
  return query
    select u.id, lower(u.email)::text, u.email_confirmed_at is not null, (u.raw_app_meta_data->>'rol')::text,
           u.created_at, u.last_sign_in_at
    from auth.users u
    where u.email is not null and u.deleted_at is null
    order by lower(u.email);
end;
$$;

-- Cuenta nueva, ya confirmada (para quien no puede crearla sola: correos de otra institución)
create or replace function public.admin_crear_cuenta(p_llave text, p_quien uuid, p_correo text, p_contrasena text, p_rol text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  correo text := lower(trim(coalesce(p_correo, '')));
  nuevo uuid := gen_random_uuid();
begin
  perform privado.revisar_superusuario(p_llave, p_quien);
  if correo !~ '^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$' or length(correo) > 254 then
    raise exception 'correo' using errcode = '22023';
  end if;
  if length(coalesce(p_contrasena, '')) not between 8 and 128 then
    raise exception 'contrasena' using errcode = '22023';
  end if;
  if coalesce(p_rol, '') not in ('admin', 'superusuario') then
    raise exception 'rol' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = correo) then
    raise exception 'ya existe' using errcode = '23505';
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', nuevo, 'authenticated', 'authenticated',
    correo, extensions.crypt(p_contrasena, extensions.gen_salt('bf', 10)), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'rol', p_rol),
    '{"email_verified":true}'::jsonb, now(), now(), '', '', '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
  values (gen_random_uuid(), nuevo, nuevo::text, 'email',
    jsonb_build_object('sub', nuevo::text, 'email', correo, 'email_verified', true, 'phone_verified', false), now(), now());

  return nuevo;
end;
$$;

-- Cambiar el rol: admin, superusuario, bloqueado o ninguno (quita el rol)
create or replace function public.admin_cambiar_rol(p_llave text, p_quien uuid, p_id uuid, p_rol text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.revisar_superusuario(p_llave, p_quien);
  if p_id = p_quien then
    raise exception 'a ti mismo no' using errcode = '22023';
  end if;
  if coalesce(p_rol, '') not in ('admin', 'superusuario', 'bloqueado', 'ninguno') then
    raise exception 'rol' using errcode = '22023';
  end if;
  update auth.users u
     set raw_app_meta_data = case when p_rol = 'ninguno'
                                  then coalesce(u.raw_app_meta_data, '{}'::jsonb) - 'rol'
                                  else coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('rol', p_rol) end,
         updated_at = now()
   where u.id = p_id;
  if not found then
    raise exception 'no existe' using errcode = 'P0002';
  end if;
end;
$$;

-- Ponerle contraseña a otra cuenta (la propia se cambia con la actual, desde Supabase Auth)
create or replace function public.admin_poner_contrasena(p_llave text, p_quien uuid, p_id uuid, p_contrasena text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.revisar_superusuario(p_llave, p_quien);
  if p_id = p_quien then
    raise exception 'a ti mismo no' using errcode = '22023';
  end if;
  if length(coalesce(p_contrasena, '')) not between 8 and 128 then
    raise exception 'contrasena' using errcode = '22023';
  end if;
  update auth.users u
     set encrypted_password = extensions.crypt(p_contrasena, extensions.gen_salt('bf', 10)), updated_at = now()
   where u.id = p_id;
  if not found then
    raise exception 'no existe' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_cuentas(text, uuid) from public, authenticated;
revoke all on function public.admin_crear_cuenta(text, uuid, text, text, text) from public, authenticated;
revoke all on function public.admin_cambiar_rol(text, uuid, uuid, text) from public, authenticated;
revoke all on function public.admin_poner_contrasena(text, uuid, uuid, text) from public, authenticated;
grant execute on function public.admin_cuentas(text, uuid) to anon, service_role;
grant execute on function public.admin_crear_cuenta(text, uuid, text, text, text) to anon, service_role;
grant execute on function public.admin_cambiar_rol(text, uuid, uuid, text) to anon, service_role;
grant execute on function public.admin_poner_contrasena(text, uuid, uuid, text) to anon, service_role;
