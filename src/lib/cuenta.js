/**
 * Cuentas de grupo: el alumno entra con código + apodo + PIN y su progreso se guarda en la
 * base de datos (a través de /api, nunca directo). El maestro entra con código + clave y ve
 * el avance del grupo.
 *
 * Sin internet o sin base de datos el juego sigue igual: todo se guarda en el navegador y se
 * sube cuando vuelve la conexión. Las respuestas que falta subir esperan en una cola.
 *
 *   alumno  → localStorage  «escuadron-cuenta»     (dura el ciclo escolar en ese equipo)
 *   maestro → sessionStorage «escuadron-maestro»   (se cierra al cerrar el navegador)
 */
import { leerProgreso, usarCuenta, mezclarDesdeServidor, alCambiar } from "./progreso.js";

const LLAVE_CUENTA = "escuadron-cuenta";
const LLAVE_MAESTRO = "escuadron-maestro";
const ESPERA = 2_000;           // se juntan los cambios de 2 s en un solo guardado
const MAX_COLA = 300;

const oyentes = new Set();
let cuenta = null;              // { pase, alumno, grupo }
let estado = "listo";           // listo | guardando | pendiente | sin-conexion
let temporizador = null;
let enCurso = null;
let consultaDisponible = null;

/* ---------------- almacenamiento seguro ---------------- */

function leer(almacen, llave) {
  try {
    const v = almacen.getItem(llave);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
function escribir(almacen, llave, valor) {
  try {
    if (valor === null) almacen.removeItem(llave);
    else almacen.setItem(llave, JSON.stringify(valor));
  } catch { /* incógnito o lleno */ }
}
const local = () => (typeof localStorage !== "undefined" ? localStorage : null);
const sesion = () => (typeof sessionStorage !== "undefined" ? sessionStorage : null);
const llaveCola = () => `escuadron-pendientes:${cuenta?.alumno?.id}`;

/* ---------------- avisos ---------------- */

function avisar() {
  const foto = { cuenta, estado };
  oyentes.forEach((fn) => fn(foto));
}
/** Escucha cambios de cuenta o de estado de guardado. Devuelve cómo dejar de escuchar. */
export function suscribirCuenta(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}
export const leerCuenta = () => cuenta;
export const estadoGuardado = () => estado;
function ponerEstado(e) {
  if (estado !== e) {
    estado = e;
    avisar();
  }
}

/* ---------------- llamadas al servidor ---------------- */

async function api(ruta, { metodo = "GET", cuerpo, pase, keepalive = false } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (pase) headers.Authorization = "Bearer " + pase;
  let r;
  try {
    r = await fetch(ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo), keepalive });
  } catch {
    const e = new Error("No hay conexión. Revisa el internet e inténtalo otra vez.");
    e.sinConexion = true;
    throw e;
  }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(datos.error || "Algo salió mal. Inténtalo otra vez.");
    e.estado = r.status;
    throw e;
  }
  return datos;
}

/** ¿El servidor tiene base de datos? Se pregunta una vez; sin respuesta, se esconde el botón. */
export function gruposDisponibles() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.resolve(!!cuenta);
  if (!consultaDisponible) {
    consultaDisponible = api("/api/alumno")
      .then((d) => !!d.disponible)
      .catch(() => false);
  }
  return consultaDisponible.then((si) => si || !!cuenta);
}

/* ---------------- alumno ---------------- */

/** datos: { accion: "registrar" | "entrar", codigo, apodo, pin, avatar } */
export async function entrarAlumno(datos) {
  const r = await api("/api/alumno", { metodo: "POST", cuerpo: datos });
  cuenta = { pase: r.pase, alumno: r.alumno, grupo: r.grupo };
  escribir(local(), LLAVE_CUENTA, cuenta);
  usarCuenta(r.alumno.id);
  mezclarDesdeServidor(r.progreso);
  avisar();
  programar(0);
  return cuenta;
}

/** Sube lo pendiente (si se puede) y vuelve al modo sin cuenta en este equipo. */
export async function salirAlumno() {
  if (cuenta) {
    try { await sincronizar(); } catch { /* lo que no se subió se queda en la cola de ese alumno */ }
  }
  clearTimeout(temporizador);
  cuenta = null;
  escribir(local(), LLAVE_CUENTA, null);
  usarCuenta(null);
  estado = "listo";
  avisar();
}

/** Lo que el alumno ya contestó hoy en la evaluación al maestro (o null). */
export async function evaluacionDeHoy() {
  if (!cuenta) return null;
  const r = await api("/api/evaluacion", { pase: cuenta.pase });
  return r.hoy;
}

/** valores: { explica, divierte, aprendo }, cada uno del 1 (😡) al 5 (😄). */
export async function enviarEvaluacion(valores) {
  if (!cuenta) throw new Error("Entra a tu grupo para evaluar a tu maestro.");
  return api("/api/evaluacion", { metodo: "POST", pase: cuenta.pase, cuerpo: valores });
}

/** Guarda una respuesta para la estadística del maestro (solo con cuenta). */
export function anotarRespuesta(r) {
  if (!cuenta) return;
  const cola = leer(local(), llaveCola()) || [];
  cola.push(r);
  escribir(local(), llaveCola(), cola.slice(-MAX_COLA));
  programar();
}

function programar(ms = ESPERA) {
  if (!cuenta) return;
  clearTimeout(temporizador);
  ponerEstado("pendiente");
  temporizador = setTimeout(() => sincronizar().catch(() => {}), ms);
}

/** Manda el progreso y las respuestas en cola; trae lo combinado por el servidor. */
export async function sincronizar({ keepalive = false } = {}) {
  if (!cuenta) return;
  if (enCurso) return enCurso;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    ponerEstado("sin-conexion");
    return;
  }
  const yo = cuenta;
  const cola = leer(local(), llaveCola()) || [];
  const lote = cola.slice(0, 60);
  ponerEstado("guardando");
  enCurso = api("/api/progreso", {
    metodo: "PUT",
    pase: yo.pase,
    keepalive,
    cuerpo: { progreso: leerProgreso(), respuestas: lote },
  })
    .then((r) => {
      if (cuenta !== yo) return;          // salió a media subida
      const resto = (leer(local(), llaveCola()) || []).slice(lote.length);
      escribir(local(), llaveCola(), resto.length ? resto : null);
      mezclarDesdeServidor(r.progreso, { avisar: false });
      ponerEstado("listo");
      if (resto.length) programar(500);
    })
    .catch((e) => {
      if (cuenta !== yo) return;
      if (e.estado === 401) {
        // el maestro lo quitó o el pase venció: se vuelve a modo sin cuenta, sin borrar nada local
        cuenta = null;
        escribir(local(), LLAVE_CUENTA, null);
        usarCuenta(null);
        estado = "listo";
        avisar();
        return;
      }
      ponerEstado(e.sinConexion ? "sin-conexion" : "pendiente");
      throw e;
    })
    .finally(() => {
      enCurso = null;
    });
  return enCurso;
}

let restaurada = false;
/**
 * Recupera la cuenta guardada en este equipo (sin red). Va antes del primer dibujo, para que
 * el juego abra directo con el progreso del alumno y no con el de quien juega sin cuenta.
 */
export function restaurarCuenta() {
  if (restaurada) return cuenta;
  restaurada = true;
  const guardada = leer(local(), LLAVE_CUENTA);
  if (guardada?.pase && guardada?.alumno?.id) {
    cuenta = guardada;
    usarCuenta(cuenta.alumno.id);
  }
  return cuenta;
}

/** Al abrir el juego: baja el progreso de la base de datos y empieza a escuchar cambios. */
export function iniciarCuenta() {
  restaurarCuenta();
  const guardada = cuenta;
  if (guardada) {
    // trae lo que se haya ganado en otro equipo
    api("/api/progreso", { pase: cuenta.pase })
      .then((r) => {
        if (cuenta !== guardada) return;
        mezclarDesdeServidor(r.progreso, { avisar: true });
        if (r.alumno) cuenta = { ...cuenta, alumno: { ...cuenta.alumno, ...r.alumno }, grupo: r.grupo || cuenta.grupo };
        escribir(local(), LLAVE_CUENTA, cuenta);
        avisar();
        if ((leer(local(), llaveCola()) || []).length) programar(0);
      })
      .catch((e) => {
        if (e.estado === 401 && cuenta === guardada) {
          cuenta = null;
          escribir(local(), LLAVE_CUENTA, null);
          usarCuenta(null);
          avisar();
        }
      });
  }
  const quitar = alCambiar(() => programar());
  const alVolverInternet = () => cuenta && sincronizar().catch(() => {});
  const alOcultar = () => {
    if (document.visibilityState === "hidden" && cuenta && estado === "pendiente") {
      clearTimeout(temporizador);
      sincronizar({ keepalive: true }).catch(() => {});
    }
  };
  window.addEventListener("online", alVolverInternet);
  document.addEventListener("visibilitychange", alOcultar);
  return () => {
    quitar();
    window.removeEventListener("online", alVolverInternet);
    document.removeEventListener("visibilitychange", alOcultar);
    clearTimeout(temporizador);
  };
}

/* ---------------- maestro ---------------- */

export const leerMaestro = () => leer(sesion(), LLAVE_MAESTRO);

async function guardarMaestro(r) {
  const m = { pase: r.pase, grupo: r.grupo };
  escribir(sesion(), LLAVE_MAESTRO, m);
  return m;
}
export const crearGrupo = (datos) =>
  api("/api/grupo", { metodo: "POST", cuerpo: { accion: "crear", ...datos } }).then(guardarMaestro);
export const entrarMaestro = (datos) =>
  api("/api/grupo", { metodo: "POST", cuerpo: { accion: "entrar", ...datos } }).then(guardarMaestro);
export function salirMaestro() {
  escribir(sesion(), LLAVE_MAESTRO, null);
}

async function comoMaestro(llamada) {
  const m = leerMaestro();
  if (!m) {
    const e = new Error("Vuelve a entrar con el código y la clave del grupo.");
    e.estado = 401;
    throw e;
  }
  try {
    return await llamada(m.pase);
  } catch (e) {
    if (e.estado === 401) salirMaestro();
    throw e;
  }
}
export const panelGrupo = () => comoMaestro((pase) => api("/api/grupo", { pase }));
export const cambiarPin = (alumno, pin) =>
  comoMaestro((pase) => api("/api/grupo", { metodo: "POST", pase, cuerpo: { accion: "pin", alumno, pin } }));
export const quitarAlumno = (alumno) =>
  comoMaestro((pase) => api("/api/grupo", { metodo: "POST", pase, cuerpo: { accion: "quitar", alumno } }));

/** Solo para pruebas. */
export function reiniciarCuenta() {
  clearTimeout(temporizador);
  cuenta = null;
  estado = "listo";
  enCurso = null;
  consultaDisponible = null;
  restaurada = false;
  oyentes.clear();
  usarCuenta(null);
}
