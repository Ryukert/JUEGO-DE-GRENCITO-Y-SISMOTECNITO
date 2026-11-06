/**
 * «¿Quién juega?»: jugadores de una computadora compartida, sin registrarse.
 *
 * En la escuela el juego suele estar en una sola computadora y los niños no tienen cuenta.
 * Cada uno escribe su nombre y recibe un ID de 6 letras y números (sin 0/O ni 1/I, para
 * dictarlo sin confusión). Cada jugador tiene su propio progreso en esa computadora.
 *
 *   localStorage   «escuadron-jugadores»       → [{ id, nombre, avatar, creado }]
 *   sessionStorage «escuadron-jugador-actual»  → id de quien juega ahora
 *
 * Quién juega se guarda solo mientras el navegador está abierto: al volver a abrir el juego se
 * pregunta otra vez, para que el siguiente niño no juegue con el nombre del anterior.
 * Nada de esto sale de la computadora.
 */
import { usarCuenta } from "./progreso.js";

const LLAVE_LISTA = "escuadron-jugadores";
const LLAVE_ACTUAL = "escuadron-jugador-actual";
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_JUGADORES = 60;

const oyentes = new Set();

function leer(almacen, llave, def) {
  try {
    const v = almacen?.getItem(llave);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
}
function escribir(almacen, llave, valor) {
  try {
    if (valor === null) almacen?.removeItem(llave);
    else almacen?.setItem(llave, JSON.stringify(valor));
  } catch { /* incógnito o lleno */ }
}
const local = () => (typeof localStorage !== "undefined" ? localStorage : null);
const sesion = () => (typeof sessionStorage !== "undefined" ? sessionStorage : null);

/** Llave del progreso de cada jugador (distinta de la de los alumnos con cuenta de grupo). */
export const llaveProgreso = (id) => `jugador-${id}`;

export function nuevoId(existentes = []) {
  const usados = new Set(existentes);
  for (let intento = 0; intento < 20; intento++) {
    const bytes = new Uint8Array(6);
    globalThis.crypto.getRandomValues(bytes);
    const id = Array.from(bytes, (b) => LETRAS[b % LETRAS.length]).join("");
    if (!usados.has(id)) return id;
  }
  throw new Error("no salió un ID libre");
}

/** «  ana   lópez » → «ana lópez»; null si no sirve. Permite letras, números, espacios y . - ' */
export function limpiarNombre(nombre) {
  const t = String(nombre ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (t.length < 2 || t.length > 30) return null;
  if (!/^[\p{L}\p{N} .'-]+$/u.test(t)) return null;
  return t;
}
const comparable = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function listarJugadores() {
  const lista = leer(local(), LLAVE_LISTA, []);
  return Array.isArray(lista) ? lista.filter((j) => j && typeof j.id === "string" && typeof j.nombre === "string") : [];
}

export function jugadorActual() {
  const id = leer(sesion(), LLAVE_ACTUAL, null);
  return listarJugadores().find((j) => j.id === id) || null;
}

function avisar() {
  const j = jugadorActual();
  oyentes.forEach((fn) => fn(j));
}
/** Avisa cuando cambia quién juega. Devuelve cómo dejar de escuchar. */
export function alCambiarJugador(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Abre el progreso de quien esté jugando (o el de «sin nombre»). Va antes del primer dibujo. */
export function restaurarJugador() {
  const j = jugadorActual();
  usarCuenta(j ? llaveProgreso(j.id) : null);
  return j;
}

/** Crea un jugador y empieza a jugar con él. Si el nombre ya está, devuelve el error. */
export function crearJugador(nombre, avatar = "sismo") {
  const limpio = limpiarNombre(nombre);
  if (!limpio) throw new Error("Escribe tu nombre: de 2 a 30 letras.");
  const lista = listarJugadores();
  if (lista.some((j) => comparable(j.nombre) === comparable(limpio))) {
    throw new Error(`Ya hay alguien llamado «${limpio}» en esta computadora. Tócalo en la lista o agrega tu apellido.`);
  }
  if (lista.length >= MAX_JUGADORES) throw new Error("Ya no caben más jugadores. Pide a tu maestro que borre a quienes ya no juegan.");
  const j = { id: nuevoId(lista.map((x) => x.id)), nombre: limpio, avatar: avatar === "green" ? "green" : "sismo", creado: new Date().toISOString() };
  escribir(local(), LLAVE_LISTA, [...lista, j]);
  return elegirJugador(j.id);
}

export function elegirJugador(id) {
  const j = listarJugadores().find((x) => x.id === id);
  if (!j) return null;
  escribir(sesion(), LLAVE_ACTUAL, j.id);
  usarCuenta(llaveProgreso(j.id));
  avisar();
  return j;
}

/** Jugar sin nombre: el progreso compartido de siempre. */
export function jugarSinNombre() {
  escribir(sesion(), LLAVE_ACTUAL, null);
  usarCuenta(null);
  avisar();
}

/** Quita a un jugador de esta computadora, con todo su progreso. */
export function borrarJugador(id) {
  escribir(local(), LLAVE_LISTA, listarJugadores().filter((j) => j.id !== id));
  try { localStorage.removeItem(`escuadron-progreso-v2:${llaveProgreso(id)}`); } catch { /* nada */ }
  if (leer(sesion(), LLAVE_ACTUAL, null) === id) jugarSinNombre();
  else avisar();
}

/** ¿Ya se preguntó quién juega en esta visita? */
export const yaSePregunto = () => leer(sesion(), "escuadron-quien-preguntado", false) === true;
export const marcarPreguntado = () => escribir(sesion(), "escuadron-quien-preguntado", true);

/** Solo para pruebas. */
export function reiniciarJugadores() {
  oyentes.clear();
}
