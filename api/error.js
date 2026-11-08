/**
 * Errores del navegador → registro de Vercel (Logs / Runtime errors). No se guardan en la base
 * de datos ni se responde nada útil: solo sirve para que quien mantiene el juego se entere
 * cuando algo se rompe en la computadora de una escuela.
 *
 *   POST /api/error { mensaje, donde, pila, version }  → 204
 *
 * Cuidados (es una función pública):
 *   - cuerpo de máximo 2 KB y cada campo recortado;
 *   - sin datos de quién juega: no se registra apodo, nombre ni IP (Vercel ya trae la suya);
 *     lo que parezca correo o teléfono en el mensaje se tapa;
 *   - de la página solo se guarda la ruta, sin lo que va después de «?» o «#»;
 *   - tope por IP (30 cada 10 minutos) y del juego completo (2,000 al día), para que nadie
 *     llene el registro. Pasado el tope responde 204 igual y no escribe nada.
 */
import { responderJson, quienEs, leerCuerpo } from "./_comun.js";
import { contar, resumen } from "./_limites.js";

const VERSION = /^\d+\.\d+\.\d+$/;

/** Recorta y tapa lo que pudiera ser un dato personal. */
export function limpiarTexto(valor, max) {
  return String(valor ?? "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[correo]")
    .replace(/\+?\d[\d\s-]{6,}\d/g, "[número]")
    .replace(/\p{Cc}/gu, (c) => (c === "\n" || c === "\t" ? c : ""))   // sin caracteres de control
    .slice(0, max)
    .trim();
}

/** Lo que se escribe en el registro, o null si no trae nada útil. */
export function armarReporte(d) {
  const mensaje = limpiarTexto(d?.mensaje, 300);
  if (!mensaje) return null;
  const donde = limpiarTexto(String(d?.donde ?? "").split(/[?#]/)[0], 100) || "/";
  const pila = limpiarTexto(d?.pila, 800)
    .split("\n")
    .slice(0, 6)
    .map((l) => l.replace(/https?:\/\/[^/\s)]+/g, ""))   // sin el dominio: solo archivo y línea
    .join("\n");
  const version = VERSION.test(String(d?.version)) ? d.version : "?";
  return { mensaje, donde, version, ...(pila ? { pila } : {}) };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return responderJson(res, 405, { error: "Usa POST" }, { Allow: "POST" });

  let d;
  try { d = await leerCuerpo(req, 2_000); }
  catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }

  const reporte = armarReporte(d);
  if (!reporte) return responderJson(res, 400, { error: "Falta el mensaje" });

  const ahora = Date.now();
  const bloque = Math.floor(ahora / 600_000), dia = Math.floor(ahora / 86_400_000);
  const tope = await contar([
    { clave: `error:${resumen("ip", quienEs(req))}:${bloque}`, segundos: 900, max: 30, motivo: "ip" },
    { clave: `error:total:${dia}`, segundos: 90_000, max: 2_000, motivo: "total" },
  ]);
  if (!tope) console.error("[navegador]", JSON.stringify(reporte));

  res.statusCode = 204;
  res.setHeader("Cache-Control", "no-store");
  return res.end();
}
