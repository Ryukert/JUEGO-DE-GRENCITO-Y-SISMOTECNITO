/**
 * Encuestas de satisfacción de los juegos (del lado del juego).
 *
 * - Solo aparecen si el servidor tiene base de datos (GET /api/encuesta, se pregunta una vez).
 * - Cada juego pregunta como mucho una vez al día, conteste o toque «Ahora no».
 * - Si no hay internet, la respuesta espera en una cola y se manda con la siguiente.
 * - Si el alumno entró a su grupo, va con su pase para el panel del maestro.
 */
import { leerCuenta } from "./cuenta.js";

const LLAVE_VISTAS = "escuadron-encuestas";
const LLAVE_COLA = "escuadron-encuestas-pendientes";
const MAX_COLA = 30;

let consulta = null;

function leer(llave, def) {
  try {
    const v = localStorage.getItem(llave);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
}
function escribir(llave, valor) {
  try {
    if (valor === null) localStorage.removeItem(llave);
    else localStorage.setItem(llave, JSON.stringify(valor));
  } catch { /* incógnito o lleno */ }
}

/** Fecha local AAAA-MM-DD (no la de Greenwich: a las 6 p. m. en Tijuana ya sería «mañana»). */
export function hoyLocal(ahora = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}`;
}

export function encuestasDisponibles() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.resolve(false);
  if (!consulta) {
    consulta = fetch("/api/encuesta")
      .then((r) => (r.ok ? r.json() : { disponible: false }))
      .then((d) => !!d?.disponible)
      .catch(() => false);
  }
  return consulta;
}

/** ¿Toca preguntar por este juego hoy? */
export function tocaPreguntar(juego, ahora = new Date()) {
  return leer(LLAVE_VISTAS, {})[juego] !== hoyLocal(ahora);
}

/** Marca el juego como preguntado hoy (contestó o dijo «Ahora no»). */
export function marcarPreguntado(juego, ahora = new Date()) {
  const hoy = hoyLocal(ahora);
  // solo importa lo de hoy: lo de días pasados se tira para que la lista no crezca sin fin
  const vistas = Object.fromEntries(Object.entries(leer(LLAVE_VISTAS, {})).filter(([, v]) => v === hoy));
  vistas[juego] = hoy;
  escribir(LLAVE_VISTAS, vistas);
}

async function mandar(e) {
  const cuenta = leerCuenta();
  const headers = { "Content-Type": "application/json" };
  if (cuenta?.pase) headers.Authorization = "Bearer " + cuenta.pase;
  const r = await fetch("/api/encuesta", { method: "POST", headers, body: JSON.stringify(e) });
  // 400 o 503: no tiene caso reintentar; 429 o red caída: sí
  if (!r.ok && r.status !== 400 && r.status !== 503) throw new Error("reintentar");
}

/** Manda la encuesta y, de paso, lo que estuviera esperando. Nunca lanza error. */
export async function enviarEncuesta({ juego, tipo, gusto, dificultad, grado }) {
  marcarPreguntado(juego);
  const cola = [...leer(LLAVE_COLA, []), { juego, tipo, gusto, dificultad, grado }];
  const quedan = [];
  for (const e of cola) {
    try {
      await mandar(e);
    } catch {
      quedan.push(e);
    }
  }
  escribir(LLAVE_COLA, quedan.length ? quedan.slice(-MAX_COLA) : null);
  return quedan.length === 0;
}

/** Solo para pruebas. */
export function reiniciarEncuestas() {
  consulta = null;
}
