/**
 * Evaluación abierta (/opinion), del lado del navegador.
 *
 * - enviarOpinion: la manda a /api/opinion. Sin internet espera en una cola (en este equipo) y
 *   se manda con la siguiente: en un evento la tableta puede perder la señal un rato.
 * - resumirOpiniones: lo que muestra la administración (promedio y caritas por pregunta).
 */
import { PREGUNTAS_OPINION, QUIENES, nombreEvento } from "../data/opinion.js";

const LLAVE_COLA = "escuadron-opiniones-pendientes";
const MAX_COLA = 200;

function leerCola() {
  try { return JSON.parse(localStorage.getItem(LLAVE_COLA) || "[]"); } catch { return []; }
}
function guardarCola(cola) {
  try {
    if (cola.length) localStorage.setItem(LLAVE_COLA, JSON.stringify(cola.slice(-MAX_COLA)));
    else localStorage.removeItem(LLAVE_COLA);
  } catch { /* incógnito o lleno */ }
}

async function mandar(o) {
  const r = await fetch("/api/opinion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
  // 400 o 503: no tiene caso reintentar; 429 o red caída: sí
  if (!r.ok && r.status !== 400 && r.status !== 503) throw new Error("reintentar");
}

/** Manda la opinión y lo que estuviera esperando. Nunca lanza error: → true si no quedó nada pendiente. */
export async function enviarOpinion(opinion) {
  const cola = [...leerCola(), opinion];
  const quedan = [];
  for (const o of cola) {
    try { await mandar(o); } catch { quedan.push(o); }
  }
  guardarCola(quedan);
  return quedan.length === 0;
}

export const opinionesPendientes = () => leerCola().length;

/** «todos» | «general» (sin evento) | id del evento. */
const delEvento = (f, evento) => (evento === "todos" ? true : evento === "general" ? !f.evento : f.evento === evento);

/**
 * Filas del servidor ({ dia, evento, quien, juego, trato, explicacion, respuestas }) →
 * { total, preguntas: [{ id, texto, conteo: [n1..n5], promedio }], quienes: [{ id, texto, total }], dias,
 *   eventos: [{ id, texto, total }] }
 * Con quien = "todos" | id de QUIENES | "sin" (no dijo), filtra por quién contestó.
 * Con evento = "todos" | "general" (sin evento) | id del evento, filtra por evento.
 * «quienes» cuenta dentro del evento elegido; «eventos» cuenta todo, del más contestado al menos.
 */
export function resumirOpiniones(todas, { quien = "todos", evento = "todos" } = {}) {
  const eventos = new Map();
  for (const f of todas) {
    const id = f.evento || "general";
    eventos.set(id, (eventos.get(id) || 0) + f.respuestas);
  }
  const listaEventos = [...eventos].map(([id, total]) => ({ id, texto: id === "general" ? "General (sin evento)" : nombreEvento(id), total }))
    .sort((a, b) => b.total - a.total || a.texto.localeCompare(b.texto));

  const filas = todas.filter((f) => delEvento(f, evento));
  const elegidas = filas.filter((f) =>
    quien === "todos" ? true : quien === "sin" ? !f.quien : f.quien === quien);
  const total = elegidas.reduce((s, f) => s + f.respuestas, 0);
  const preguntas = PREGUNTAS_OPINION.map((p) => {
    const conteo = [0, 0, 0, 0, 0];
    for (const f of elegidas) if (f[p.id] >= 1 && f[p.id] <= 5) conteo[f[p.id] - 1] += f.respuestas;
    const suma = conteo.reduce((s, n, i) => s + n * (i + 1), 0);
    return { id: p.id, texto: p.texto, corto: p.corto, conteo, promedio: total ? suma / total : 0 };
  });
  const quienes = [...QUIENES, { id: "sin", texto: "No dijo" }].map((q) => ({
    ...q,
    total: filas.filter((f) => (q.id === "sin" ? !f.quien : f.quien === q.id)).reduce((s, f) => s + f.respuestas, 0),
  }));
  const porDia = new Map();
  for (const f of elegidas) porDia.set(f.dia, (porDia.get(f.dia) || 0) + f.respuestas);
  const dias = [...porDia].map(([dia, n]) => ({ dia, total: n })).sort((a, b) => a.dia.localeCompare(b.dia));
  return { total, preguntas, quienes, dias, eventos: listaEventos };
}
