/**
 * Conexión con la base de datos (Supabase, por su API REST). Solo corre en el servidor.
 *
 * Variables: SUPABASE_URL y SUPABASE_SECRET_KEY (la llave secreta «sb_secret_…»; también se
 * acepta la vieja SUPABASE_SERVICE_ROLE_KEY). Esa llave salta RLS, así que nunca va al navegador
 * ni lleva el prefijo VITE_. Las tablas tienen RLS sin políticas: con la llave pública no se ve nada.
 */

import { createHmac } from "node:crypto";

export function configuracionDb(env = process.env) {
  const url = env.SUPABASE_URL ? String(env.SUPABASE_URL).replace(/\/+$/, "") : "";
  const llave = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
  return url && llave ? { url, llave } : null;
}

export class ErrorDb extends Error {
  constructor(estado, codigo, mensaje) {
    super(mensaje || "error de base de datos");
    this.estado = estado;
    this.codigo = codigo;   // código de Postgres, p. ej. 23505 = ya existe
  }
}

/**
 * db("alumnos?grupo_id=eq.X&select=id,apodo")
 * db("alumnos", { metodo: "POST", cuerpo: {...}, devolver: true })
 */
export async function db(ruta, { metodo = "GET", cuerpo, devolver = false, unir = false, env = process.env } = {}) {
  const cfg = configuracionDb(env);
  if (!cfg) throw new ErrorDb(503, null, "base de datos sin configurar");
  const headers = { apikey: cfg.llave, "Content-Type": "application/json" };
  // las llaves viejas (JWT) también van como Bearer; las nuevas sb_secret_ solo en apikey
  if (cfg.llave.startsWith("eyJ")) headers.Authorization = "Bearer " + cfg.llave;
  const preferir = [];
  if (devolver) preferir.push("return=representation");
  if (unir) preferir.push("resolution=merge-duplicates");
  if (preferir.length) headers.Prefer = preferir.join(",");

  const r = await fetch(`${cfg.url}/rest/v1/${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await r.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { /* respuesta vacía */ }
  if (!r.ok) throw new ErrorDb(r.status, datos?.code || null, datos?.message);
  return datos;
}

/**
 * Modo «solo encuestas»: sin llave secreta, con la PUBLICABLE (sb_publishable_…) + JUEGO_SECRETO.
 * La llave publicable sola no puede leer ni escribir nada; solo puede llamar a funciones como
 * public.registrar_encuesta, que además piden la «llave de la API» (derivada de JUEGO_SECRETO).
 */
export function configuracionRpc(env = process.env) {
  const url = env.SUPABASE_URL ? String(env.SUPABASE_URL).replace(/\/+$/, "") : "";
  const llave = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || "";
  const s = env.JUEGO_SECRETO;
  return url && llave && typeof s === "string" && s.length >= 32 ? { url, llave, secreto: s } : null;
}

/** La llave que la función de Supabase compara (allá solo está su sha256). */
export const llaveApi = (secreto) => createHmac("sha256", secreto).update("api-rpc").digest("hex");

export async function rpc(nombre, args, { env = process.env } = {}) {
  const cfg = configuracionRpc(env);
  if (!cfg) throw new ErrorDb(503, null, "base de datos sin configurar");
  const headers = { apikey: cfg.llave, "Content-Type": "application/json" };
  if (cfg.llave.startsWith("eyJ")) headers.Authorization = "Bearer " + cfg.llave;
  const r = await fetch(`${cfg.url}/rest/v1/rpc/${nombre}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_llave: llaveApi(cfg.secreto), ...args }),
  });
  const texto = await r.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { /* vacío */ }
  if (!r.ok) throw new ErrorDb(r.status, datos?.code || null, datos?.message);
  return datos;
}

/** Para los filtros de la URL (?campo=eq.valor). */
export const eq = (v) => "eq." + encodeURIComponent(String(v));
