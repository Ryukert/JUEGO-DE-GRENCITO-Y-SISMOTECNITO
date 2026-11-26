-- Avisos del asesor de Supabase (Advisors).
--
-- 1. public.rls_auto_enable es la función del disparador de eventos «ensure_rls» (activa RLS en
--    cada tabla nueva de public). La llama Postgres al crear tablas, nunca la página: nadie
--    tiene por qué poder ejecutarla por /rest/v1/rpc. El disparador sigue funcionando igual.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 2. Índice para la llave foránea encuestas.alumno_id (al quitar un alumno, Postgres busca sus
--    encuestas por esta columna).
create index if not exists encuestas_alumno_idx on public.encuestas (alumno_id);
