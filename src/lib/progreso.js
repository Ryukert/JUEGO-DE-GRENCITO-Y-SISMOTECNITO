/**
 * Progreso guardado en el navegador: récords, insignias, grado escolar,
 * XP, monedas y el historial de cada minijuego.
 *
 * Si el almacenamiento está bloqueado, el juego sigue funcionando en memoria.
 *
 * Versiones:
 *   v1 → grado, records por personaje, insignias, partidas
 *   v2 → agrega xp, escudos, semillas, juegos{} y logros[]
 *
 * La migración de v1 a v2 es automática y no pierde nada.
 *
 * Cuentas de alumno (src/lib/cuenta.js): cada alumno que entra a un grupo tiene su
 * propia copia en este navegador («escuadron-progreso-v2:<id>»), separada de la de
 * quien juega sin cuenta. Así varios niños pueden usar la misma computadora sin
 * mezclar récords. Cada vez que algo se guarda se avisa a `alCambiar`, y la cuenta
 * lo sube a la base de datos.
 */
import { mezclarProgreso } from "./mezcla.js";

const LLAVE_INVITADO = "escuadron-progreso-v2";
const LLAVE_VIEJA = "escuadron-progreso-v1";
let LLAVE = LLAVE_INVITADO;
const oyentes = new Set();

const VACIO = {
  version: 2,
  grado: null,
  records: { sismo: 0, green: 0 },
  insignias: [],
  partidas: 0,
  xp: 0,
  escudos: 0,
  semillas: 0,
  juegos: {}, // id → { record, partidas, mejorPrecision, dificultades: [] }
  logros: [],
};

let memoria = { ...VACIO, records: { ...VACIO.records }, juegos: {} };
let cargado = false;

function normalizar(crudo) {
  const base = { ...VACIO, ...crudo };
  base.records = { ...VACIO.records, ...(crudo.records || {}) };
  base.juegos = { ...(crudo.juegos || {}) };
  base.insignias = Array.isArray(crudo.insignias) ? crudo.insignias : [];
  base.logros = Array.isArray(crudo.logros) ? crudo.logros : [];
  base.version = 2;
  return base;
}

export function leerProgreso() {
  if (cargado) return instantanea();
  try {
    const crudo = localStorage.getItem(LLAVE);
    if (crudo) {
      memoria = normalizar(JSON.parse(crudo));
    } else if (LLAVE === LLAVE_INVITADO) {
      // primera vez con v2: rescatamos lo que hubiera guardado en v1
      const viejo = localStorage.getItem(LLAVE_VIEJA);
      if (viejo) {
        memoria = normalizar(JSON.parse(viejo));
        guardar();
      }
    }
  } catch (e) {
    /* modo incógnito o almacenamiento lleno: seguimos solo en memoria */
  }
  cargado = true;
  return instantanea();
}

function guardar({ avisar = true } = {}) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(memoria));
  } catch (e) {}
  if (avisar) oyentes.forEach((fn) => fn(instantanea()));
}

/** Avisa cada vez que el progreso cambia en este navegador. Devuelve cómo dejar de escuchar. */
export function alCambiar(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Cambia a la copia de un alumno (id) o a la de quien juega sin cuenta (null). */
export function usarCuenta(id) {
  LLAVE = id ? `${LLAVE_INVITADO}:${id}` : LLAVE_INVITADO;
  memoria = { ...VACIO, records: { ...VACIO.records }, juegos: {} };
  cargado = false;
  return leerProgreso();
}

/** Junta lo que llegó de la base de datos con lo de este navegador (el grado local manda). */
export function mezclarDesdeServidor(datos, { avisar = false } = {}) {
  leerProgreso();
  memoria = normalizar(mezclarProgreso(datos, memoria));
  guardar({ avisar });
  return instantanea();
}

/** Copia nueva, para que React note el cambio de estado. */
function instantanea() {
  return { ...memoria, records: { ...memoria.records }, juegos: { ...memoria.juegos } };
}

export function guardarGrado(grado) {
  leerProgreso();
  memoria.grado = grado;
  guardar();
  return instantanea();
}

export function registrarPartida({ personaje, puntos, insignias }) {
  leerProgreso();
  memoria.partidas += 1;
  const antes = memoria.records[personaje] || 0;
  const nuevoRecord = puntos > antes;
  if (nuevoRecord) memoria.records[personaje] = puntos;
  memoria.insignias = [...new Set([...memoria.insignias, ...insignias])];
  guardar();
  return { nuevoRecord, recordAnterior: antes };
}

/**
 * Guarda el resultado de un minijuego y devuelve qué cambió.
 * Nunca resta XP ni monedas: el progreso solo sube.
 */
export function registrarMinijuego(idJuego, resultado) {
  leerProgreso();

  const antes = memoria.juegos[idJuego] || {
    record: 0,
    partidas: 0,
    mejorPrecision: 0,
    dificultades: [],
  };

  const nuevoRecord = (resultado.score || 0) > antes.record;
  const dificultades = resultado.completed
    ? [...new Set([...antes.dificultades, resultado.dificultad])]
    : antes.dificultades;

  memoria.juegos[idJuego] = {
    record: Math.max(antes.record, resultado.score || 0),
    partidas: antes.partidas + 1,
    mejorPrecision: Math.max(antes.mejorPrecision, resultado.accuracy || 0),
    dificultades,
  };

  memoria.xp += Math.max(0, resultado.xp || 0);
  memoria.escudos += Math.max(0, resultado.reward?.shields || 0);
  memoria.semillas += Math.max(0, resultado.reward?.seeds || 0);

  guardar();
  return { nuevoRecord, recordAnterior: antes.record, progreso: instantanea() };
}

export function registrarLogro(id) {
  leerProgreso();
  if (memoria.logros.includes(id)) return false;
  memoria.logros.push(id);
  guardar();
  return true;
}

export function recordDeJuego(progreso, idJuego) {
  return progreso?.juegos?.[idJuego]?.record || 0;
}

export function borrarProgreso() {
  memoria = { ...VACIO, records: { ...VACIO.records }, juegos: {} };
  cargado = true;
  try {
    localStorage.removeItem(LLAVE);
    localStorage.removeItem(LLAVE_VIEJA);
  } catch (e) {}
  return instantanea();
}

export const RANGOS = [
  { min: 0, nombre: "Aprendiz", icono: "🔰" },
  { min: 120, nombre: "Vigilante", icono: "🥉" },
  { min: 220, nombre: "Guardián", icono: "🥈" },
  { min: 320, nombre: "Capitán", icono: "🥇" },
  { min: 420, nombre: "Leyenda", icono: "👑" },
];

export function rangoPara(puntos) {
  return [...RANGOS].reverse().find((r) => puntos >= r.min) || RANGOS[0];
}
