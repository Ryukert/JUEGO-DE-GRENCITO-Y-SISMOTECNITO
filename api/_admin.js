/**
 * Cuentas de administración con correo institucional (no es una función: el «_» hace que
 * Vercel no la publique).
 *
 * Cualquiera con correo institucional (src/data/institucion.js) puede crear su cuenta, pero
 * solo entra después de CONFIRMAR su correo: así nadie se registra con la dirección de otro.
 * Las cuentas viven en Supabase Auth (Authentication → Users).
 *
 * Roles (`app_metadata.rol`, solo se ponen desde la base de datos o desde el panel del
 * superusuario; ningún correo se escribe en el código porque el repositorio es público):
 *   sin rol        entra si su correo es institucional
 *   admin          entra aunque su correo no sea institucional (p. ej. de otra universidad)
 *   superusuario   lo mismo, y además administra las cuentas desde la página
 *   bloqueado      no entra
 *
 * El panel del superusuario usa las funciones public.admin_* de la base de datos
 * (supabase/migrations/20261126000000_cuentas_admin.sql), con la llave de la API derivada de
 * JUEGO_SECRETO. Cada función vuelve a revisar en auth.users que quien la pide siga siendo
 * superusuario.
 *
 * El navegador nunca recibe los tokens de Supabase: solo el pase de editor (8 horas). La única
 * excepción es el enlace para cambiar la contraseña, que Supabase manda por correo y la página
 * devuelve aquí una sola vez (ponerContrasenaNueva).
 *
 * Usa la llave publicable (SUPABASE_PUBLISHABLE_KEY) o, si no está, la secreta.
 */
import { esCorreoInstitucional } from "../src/data/institucion.js";
import { llaveApi } from "./_db.js";

export { esCorreoInstitucional };

const CORREO = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
export const MINIMO_NUEVA = 8;   // contraseñas nuevas; para entrar se aceptan las de 6 o más

export const limpiarCorreo = (c) => {
  const t = String(c ?? "").trim().toLowerCase();
  return t.length <= 254 && CORREO.test(t) ? t : null;
};
export const contrasenaValida = (c, minimo = 6) => typeof c === "string" && c.length >= minimo && c.length <= 128;

export function configuracionAuth(env = process.env) {
  const url = env.SUPABASE_URL ? String(env.SUPABASE_URL).replace(/\/+$/, "") : "";
  const llave = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_SECRET_KEY || "";
  return url && llave ? { url, llave } : null;
}

async function auth(ruta, { metodo = "POST", cuerpo, token, env = process.env } = {}) {
  const cfg = configuracionAuth(env);
  if (!cfg) return { estado: 0, datos: null };
  const headers = { apikey: cfg.llave, "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  else if (cfg.llave.startsWith("eyJ")) headers.Authorization = "Bearer " + cfg.llave;
  try {
    const r = await fetch(`${cfg.url}/auth/v1/${ruta}`, { method: metodo, headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    return { estado: r.status, datos: await r.json().catch(() => ({})) };
  } catch {
    return { estado: 0, datos: null };
  }
}

const codigo = (d) => String(d?.error_code || d?.code || d?.error || "").toLowerCase();

/**
 * Revisa correo y contraseña. Entra quien tiene correo institucional confirmado y no está
 * bloqueado. → { ok: true, correo } | { ok: false, motivo }
 *   motivo: "credenciales" | "sin-confirmar" | "bloqueado" | "no-institucional" | "sin-servicio"
 */
export async function entrarAdministrador(correo, contrasena, { env } = {}) {
  const { estado, datos } = await auth("token?grant_type=password", { cuerpo: { email: correo, password: contrasena }, env });
  if (estado === 0) return { ok: false, motivo: "sin-servicio" };
  if (estado >= 400 && estado < 500 && estado !== 429) {
    return { ok: false, motivo: codigo(datos).includes("email_not_confirmed") ? "sin-confirmar" : "credenciales" };
  }
  if (estado < 200 || estado >= 300) return { ok: false, motivo: "sin-servicio" };
  const u = datos?.user || {};
  // aunque el proyecto tuviera apagada la confirmación de correo, aquí se exige
  if (!(u.email_confirmed_at || u.confirmed_at)) return { ok: false, motivo: "sin-confirmar" };
  const rol = u.app_metadata?.rol;
  if (rol === "bloqueado") return { ok: false, motivo: "bloqueado" };
  const superusuario = rol === "superusuario";
  if (!superusuario && rol !== "admin" && !esCorreoInstitucional(u.email || correo)) return { ok: false, motivo: "no-institucional" };
  return { ok: true, correo: String(u.email || correo).toLowerCase(), superusuario, id: u.id || null };
}

/**
 * Cambiar la propia contraseña ya dentro de la administración: se revisa la actual y, con el
 * token que da Supabase al revisarla, se pone la nueva. El token no sale del servidor.
 * → { ok: true } | { ok: false, motivo: "credenciales" | "misma" | "contrasena" | "sin-servicio" }
 */
export async function cambiarMiContrasena(correo, actual, nueva, { env } = {}) {
  const { estado, datos } = await auth("token?grant_type=password", { cuerpo: { email: correo, password: actual }, env });
  if (estado === 0 || estado === 429 || estado >= 500) return { ok: false, motivo: "sin-servicio" };
  if (estado >= 400 || !datos?.access_token) return { ok: false, motivo: "credenciales" };
  const r = await ponerContrasenaNueva(datos.access_token, nueva, { env });
  if (r.ok) return { ok: true };
  return { ok: false, motivo: r.motivo === "enlace" ? "sin-servicio" : r.motivo };
}

/* ---------------- panel del superusuario (funciones public.admin_* de la base) ---------------- */

export const ROLES = ["admin", "superusuario", "bloqueado", "ninguno"];

function configuracionCuentas(env = process.env) {
  const url = env.SUPABASE_URL ? String(env.SUPABASE_URL).replace(/\/+$/, "") : "";
  const llave = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
  const s = env.JUEGO_SECRETO;
  return url && llave && typeof s === "string" && s.length >= 32 ? { url, llave, secreto: s } : null;
}

/** → { ok: true, datos } | { ok: false, motivo: "sin-permiso" | "ya-existe" | "datos" | "no-existe" | "sin-servicio" } */
async function funcionCuentas(nombre, args, env = process.env) {
  const cfg = configuracionCuentas(env);
  if (!cfg) return { ok: false, motivo: "sin-servicio" };
  const headers = { apikey: cfg.llave, "Content-Type": "application/json" };
  if (cfg.llave.startsWith("eyJ")) headers.Authorization = "Bearer " + cfg.llave;
  try {
    const r = await fetch(`${cfg.url}/rest/v1/rpc/${nombre}`, {
      method: "POST", headers, body: JSON.stringify({ p_llave: llaveApi(cfg.secreto), ...args }),
    });
    const texto = await r.text();
    let datos = null;
    try { datos = texto ? JSON.parse(texto) : null; } catch { /* vacío */ }
    if (r.ok) return { ok: true, datos };
    const motivo = { 42501: "sin-permiso", 23505: "ya-existe", 22023: "datos", P0002: "no-existe" }[datos?.code];
    return { ok: false, motivo: motivo || "sin-servicio", detalle: datos?.message };
  } catch {
    return { ok: false, motivo: "sin-servicio" };
  }
}

export const listarCuentas = (quien, op) => funcionCuentas("admin_cuentas", { p_quien: quien }, op?.env);
export const crearCuentaAdmin = (quien, correo, contrasena, rol, op) =>
  funcionCuentas("admin_crear_cuenta", { p_quien: quien, p_correo: correo, p_contrasena: contrasena, p_rol: rol }, op?.env);
export const cambiarRol = (quien, id, rol, op) => funcionCuentas("admin_cambiar_rol", { p_quien: quien, p_id: id, p_rol: rol }, op?.env);
export const ponerContrasenaAdmin = (quien, id, contrasena, op) =>
  funcionCuentas("admin_poner_contrasena", { p_quien: quien, p_id: id, p_contrasena: contrasena }, op?.env);

/**
 * Crea la cuenta; Supabase manda el correo de confirmación con un enlace a `regreso`.
 * Si el correo ya tenía cuenta, se responde igual (no se revela quién está registrado).
 * → { ok: true } | { ok: false, motivo: "contrasena" | "muchos-correos" | "sin-servicio" }
 */
export async function crearCuenta(correo, contrasena, regreso, { env } = {}) {
  const { estado, datos } = await auth(`signup?redirect_to=${encodeURIComponent(regreso)}`, { cuerpo: { email: correo, password: contrasena }, env });
  if (estado >= 200 && estado < 300) return { ok: true };
  if (estado === 429 || codigo(datos).includes("rate_limit")) return { ok: false, motivo: "muchos-correos" };
  if (codigo(datos).includes("already")) return { ok: true };
  if (estado === 422 || estado === 400) return { ok: false, motivo: "contrasena" };
  return { ok: false, motivo: "sin-servicio" };
}

/** Manda el correo para poner una contraseña nueva (responde igual exista o no la cuenta). */
export async function pedirCambioDeContrasena(correo, regreso, { env } = {}) {
  const { estado, datos } = await auth(`recover?redirect_to=${encodeURIComponent(regreso)}`, { cuerpo: { email: correo }, env });
  if (estado === 429 || codigo(datos).includes("rate_limit")) return { ok: false, motivo: "muchos-correos" };
  if (estado === 0 || estado >= 500) return { ok: false, motivo: "sin-servicio" };
  return { ok: true };
}

/** Con el token del enlace del correo, pone la contraseña nueva. */
export async function ponerContrasenaNueva(token, contrasena, { env } = {}) {
  if (typeof token !== "string" || token.length < 20 || token.length > 4000) return { ok: false, motivo: "enlace" };
  const { estado, datos } = await auth("user", { metodo: "PUT", token, cuerpo: { password: contrasena }, env });
  if (estado >= 200 && estado < 300) return { ok: true, correo: datos?.email || null };
  if (estado === 401 || estado === 403) return { ok: false, motivo: "enlace" };
  if (estado === 422) return { ok: false, motivo: codigo(datos).includes("same_password") ? "misma" : "contrasena" };
  return { ok: false, motivo: "sin-servicio" };
}
