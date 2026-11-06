/**
 * Piezas que comparten las funciones de grupos, alumnos y progreso (el «_» hace que Vercel no la
 * publique como función).
 *
 *   - Respuestas JSON y lectura del cuerpo con tope de tamaño.
 *   - Sesiones: un pase firmado (HMAC) con quién es y hasta cuándo vale. No hay tabla de
 *     sesiones; si alguien cambia una letra del pase, la firma ya no coincide.
 *   - PIN y clave del maestro: se guardan resumidos con scrypt + sal + JUEGO_SECRETO.
 *
 * Variable requerida: JUEGO_SECRETO (32 caracteres o más, al azar).
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function responderJson(res, codigo, cuerpo, extra = {}) {
  res.statusCode = codigo;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  return res.end(JSON.stringify(cuerpo));
}

export function quienEs(req) {
  const cabecera = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "";
  return String(cabecera).split(",")[0].trim() || req.socket?.remoteAddress || "anonimo";
}

export async function leerCuerpo(req, max = 80_000) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const partes = [];
  let total = 0;
  for await (const trozo of req) {
    total += trozo.length;
    if (total > max) throw new Error("cuerpo demasiado grande");
    partes.push(trozo);
  }
  return JSON.parse(Buffer.concat(partes).toString("utf8") || "{}");
}

/* ---------------- secreto, pases y resúmenes ---------------- */

export function secreto(env = process.env) {
  const s = env.JUEGO_SECRETO;
  return typeof s === "string" && s.length >= 32 ? s : null;
}

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const firma = (texto, s) => createHmac("sha256", s).update(texto).digest("base64url");

/** Duración de cada pase: el alumno no vuelve a escribir su PIN en un ciclo escolar; el maestro, cada día. */
export const DURACION = { alumno: 200 * 86_400_000, maestro: 12 * 3_600_000 };

export function crearPase(datos, { env = process.env, ahora = Date.now() } = {}) {
  const s = secreto(env);
  if (!s) throw new Error("falta JUEGO_SECRETO");
  const cuerpo = b64(JSON.stringify({ ...datos, exp: ahora + DURACION[datos.rol] }));
  return cuerpo + "." + firma(cuerpo, s);
}

/** Devuelve lo que dice el pase si es auténtico y vigente; si no, null. */
export function leerPase(pase, { env = process.env, ahora = Date.now() } = {}) {
  const s = secreto(env);
  if (!s || typeof pase !== "string" || pase.length > 600) return null;
  const [cuerpo, sello, sobra] = pase.split(".");
  if (!cuerpo || !sello || sobra !== undefined) return null;
  const esperado = Buffer.from(firma(cuerpo, s));
  const recibido = Buffer.from(sello);
  if (esperado.length !== recibido.length || !timingSafeEqual(esperado, recibido)) return null;
  try {
    const d = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
    if (!d || typeof d.exp !== "number" || d.exp < ahora) return null;
    if (d.rol !== "alumno" && d.rol !== "maestro") return null;
    return d;
  } catch {
    return null;
  }
}

/** El pase llega en la cabecera Authorization: Bearer <pase>. */
export function paseDe(req, rol, op) {
  const cabecera = String(req.headers.authorization || "");
  const d = leerPase(cabecera.startsWith("Bearer ") ? cabecera.slice(7) : "", op);
  return d && d.rol === rol ? d : null;
}

export function resumirClave(valor, env = process.env) {
  const sal = randomBytes(16);
  const hash = scryptSync(String(valor) + "|" + secreto(env), sal, 32);
  return `s1$${b64(sal)}$${b64(hash)}`;
}

export function claveCorrecta(valor, guardado, env = process.env) {
  const [v, sal, hash] = String(guardado || "").split("$");
  if (v !== "s1" || !sal || !hash) return false;
  const calculado = scryptSync(String(valor) + "|" + secreto(env), Buffer.from(sal, "base64url"), 32);
  const esperado = Buffer.from(hash, "base64url");
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}

/* ---------------- validaciones de lo que escribe la gente ---------------- */

/** «  Ána  López » → «Ána López» (lo que se muestra) y «ana lopez» (para comparar). */
export function limpiarApodo(apodo) {
  const visible = String(apodo ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (visible.length < 2 || visible.length > 20) return null;
  if (!/^[\p{L}\p{N} ._-]+$/u.test(visible)) return null;
  const normal = visible.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return { visible, normal };
}

export const pinValido = (pin) => typeof pin === "string" && /^\d{4}$/.test(pin);
export const claveValida = (clave) => typeof clave === "string" && clave.length >= 6 && clave.length <= 64;

/** Sin 0/O ni 1/I para que se dicte en el salón sin confusiones. */
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function nuevoCodigo() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => LETRAS[b % LETRAS.length]).join("");
}
export const limpiarCodigo = (c) => {
  const t = String(c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z2-9]{6}$/.test(t) ? t : null;
};
