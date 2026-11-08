/**
 * Avisar de los errores del navegador (solo en la versión publicada) a /api/error, que los
 * escribe en el registro de Vercel. Así se sabe cuando algo se rompe en la computadora de una
 * escuela aunque nadie lo reporte.
 *
 * - Máximo MAXIMO avisos por visita y nunca el mismo mensaje dos veces.
 * - No manda quién juega: solo el mensaje, la ruta de la página, la pila y la versión.
 * - Ignora lo que no es del juego (extensiones del navegador, «Script error.» de otros sitios).
 */
import { VERSION } from "./version.js";

export const MAXIMO = 5;
const enviados = new Set();

const RUIDO = [/^Script error\.?$/i, /ResizeObserver loop/i, /^Load failed$/i, /chrome-extension:|moz-extension:|safari-extension:/i];

/** ¿Vale la pena avisar de este error? */
export function esDelJuego(mensaje, archivo = "", origen = typeof location !== "undefined" ? location.origin : "") {
  if (!mensaje) return false;
  if (RUIDO.some((r) => r.test(mensaje) || r.test(archivo))) return false;
  // si el navegador dice de qué archivo vino y no es de este sitio, no es nuestro
  if (archivo && origen && /^https?:/.test(archivo) && !archivo.startsWith(origen)) return false;
  return true;
}

/** Manda el aviso (con sendBeacon si se puede: funciona aunque la página se esté cerrando). */
export function reportarError(error, { enviar } = {}) {
  const mensaje = String(error?.message || error || "").slice(0, 300);
  if (!mensaje || enviados.has(mensaje) || enviados.size >= MAXIMO) return false;
  enviados.add(mensaje);
  const cuerpo = JSON.stringify({
    mensaje,
    donde: typeof location !== "undefined" ? location.pathname : "",
    pila: String(error?.stack || "").slice(0, 800),
    version: VERSION,
  });
  try {
    if (enviar) enviar(cuerpo);
    else if (typeof navigator !== "undefined" && navigator.sendBeacon?.("/api/error", new Blob([cuerpo], { type: "application/json" }))) {
      /* enviado */
    } else {
      fetch("/api/error", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo, keepalive: true }).catch(() => {});
    }
  } catch {
    /* avisar nunca debe romper el juego */
  }
  return true;
}

/** Escucha los errores sin atrapar de la página. Devuelve cómo dejar de escuchar. */
export function iniciarReporteDeErrores(ventana = typeof window !== "undefined" ? window : null) {
  if (!ventana) return () => {};
  const alError = (e) => {
    if (esDelJuego(e.message, e.filename)) reportarError(e.error || e.message);
  };
  const alRechazo = (e) => {
    const r = e.reason;
    const mensaje = String(r?.message || r || "");
    if (esDelJuego(mensaje)) reportarError(r instanceof Error ? r : mensaje);
  };
  ventana.addEventListener("error", alError);
  ventana.addEventListener("unhandledrejection", alRechazo);
  return () => {
    ventana.removeEventListener("error", alError);
    ventana.removeEventListener("unhandledrejection", alRechazo);
  };
}

/** Solo para pruebas. */
export function reiniciarErrores() {
  enviados.clear();
}
