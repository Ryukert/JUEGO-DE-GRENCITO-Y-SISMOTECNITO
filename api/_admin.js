/**
 * Administradores con correo y contraseña (no es una función: el «_» hace que Vercel no la publique).
 *
 * Las cuentas viven en Supabase Auth (Authentication → Users): ahí se crean, se les cambia la
 * contraseña o se borran. El servidor revisa el correo y la contraseña con Supabase y solo deja
 * pasar a quien tiene `app_metadata.rol = "admin"`: esa marca solo la pone el servidor o quien
 * administra la base de datos, nunca el propio usuario.
 *
 *   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"admin"}'
 *   where email = 'correo@escuela.mx';
 *
 * Solo correos institucionales (src/data/institucion.js): cualquier otro dominio se rechaza
 * antes de preguntar a Supabase.
 *
 * El navegador nunca recibe los tokens de Supabase: solo el pase de editor (8 horas).
 * Usa la llave publicable (SUPABASE_PUBLISHABLE_KEY) o, si no está, la secreta.
 */

import { esCorreoInstitucional } from "../src/data/institucion.js";
export { esCorreoInstitucional };

const CORREO = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export const limpiarCorreo = (c) => {
  const t = String(c ?? "").trim().toLowerCase();
  return t.length <= 254 && CORREO.test(t) ? t : null;
};
export const contrasenaValida = (c) => typeof c === "string" && c.length >= 6 && c.length <= 128;

export function configuracionAuth(env = process.env) {
  const url = env.SUPABASE_URL ? String(env.SUPABASE_URL).replace(/\/+$/, "") : "";
  const llave = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_SECRET_KEY || "";
  return url && llave ? { url, llave } : null;
}

/**
 * Revisa correo y contraseña con Supabase Auth.
 * → { ok: true, correo } | { ok: false, motivo: "credenciales" | "no-admin" | "sin-servicio" }
 */
export async function entrarAdministrador(correo, contrasena, { env = process.env } = {}) {
  const cfg = configuracionAuth(env);
  if (!cfg) return { ok: false, motivo: "sin-servicio" };
  const headers = { apikey: cfg.llave, "Content-Type": "application/json" };
  if (cfg.llave.startsWith("eyJ")) headers.Authorization = "Bearer " + cfg.llave;
  let r;
  try {
    r = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: correo, password: contrasena }),
    });
  } catch {
    return { ok: false, motivo: "sin-servicio" };
  }
  const d = await r.json().catch(() => ({}));
  if (r.status === 400 || r.status === 401 || r.status === 422) return { ok: false, motivo: "credenciales" };
  if (!r.ok) return { ok: false, motivo: "sin-servicio" };
  if (d?.user?.app_metadata?.rol !== "admin") return { ok: false, motivo: "no-admin" };
  // por si el correo de la cuenta en Supabase no fuera institucional
  if (!esCorreoInstitucional(d.user.email || correo)) return { ok: false, motivo: "no-admin" };
  return { ok: true, correo: String(d.user.email || correo).toLowerCase() };
}
