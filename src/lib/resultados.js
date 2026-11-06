/**
 * Resultados de las encuestas para la ventana de editores: convierte las filas resumidas del
 * servidor ({ juego, tipo, grado, dia, gusto, dificultad, respuestas }) en lo que pintan las
 * gráficas y el PDF. Sin React, para poder probarlo y reusarlo en el PDF.
 */
import { POR_ID } from "../juegos/registro.js";
import { PERSONAJES } from "../data/personajes.js";

/**
 * Escala divergente para las gráficas: rojo (no les gustó) → gris neutro → azul (les gustó).
 * El rojo→verde de las caritas del juego no se distingue con daltonismo; esta sí
 * (validada con la guía de visualización). Siempre va con su emoji y su etiqueta.
 */
export const COLORES_GUSTO = {
  claro: ["#b42318", "#e46f55", "#b0b0ab", "#4f8ed6", "#1d4f99"],
  oscuro: ["#d23b28", "#e98068", "#7d7d79", "#5c9be2", "#2f6fc2"],
};
export const ETIQUETAS_GUSTO = [
  { emoji: "😡", texto: "Nada" },
  { emoji: "🙁", texto: "Poco" },
  { emoji: "😐", texto: "Más o menos" },
  { emoji: "🙂", texto: "Bien" },
  { emoji: "😄", texto: "¡Muy bien!" },
];
export const COLORES_DIFICULTAD = ["#5aa9e6", "#8cc540", "#9b6fd6"];
export const ETIQUETAS_DIFICULTAD = [
  { emoji: "😴", texto: "Muy fácil" },
  { emoji: "👌", texto: "Justo" },
  { emoji: "😰", texto: "Muy difícil" },
];

/** Nombre para mostrar; null si el juego no está en el catálogo (pruebas, juegos quitados). */
export function nombreDeJuego(juego, tipo) {
  if (tipo === "mision") {
    const p = PERSONAJES[String(juego).replace("mision-", "")];
    return p ? `Misiones de ${p.nombre}` : null;
  }
  return POR_ID[juego]?.nombre || null;
}

const vacio = () => ({ total: 0, gusto: [0, 0, 0, 0, 0], dificultad: [0, 0, 0] });
function sumar(acc, f) {
  const n = Number(f.respuestas) || 0;
  acc.total += n;
  if (f.gusto >= 1 && f.gusto <= 5) acc.gusto[f.gusto - 1] += n;
  if (f.dificultad >= 1 && f.dificultad <= 3) acc.dificultad[f.dificultad - 1] += n;
}
export const promedio = (gusto) => {
  const t = gusto.reduce((s, n) => s + n, 0);
  return t ? gusto.reduce((s, n, i) => s + n * (i + 1), 0) / t : 0;
};

/**
 * filtros: { grado: "todos" | "primaria" | "secundaria", tipo: "todos" | "minijuego" | "mision" }
 * → { general, juegos: [...ordenados por promedio], dias: [{ dia, total }], fueraDeCatalogo }
 */
export function resumir(filas, { grado = "todos", tipo = "todos" } = {}) {
  const general = vacio();
  const porJuego = new Map();
  const porDia = new Map();
  let fueraDeCatalogo = 0;

  for (const f of filas) {
    if (grado !== "todos" && f.grado !== grado) continue;
    if (tipo !== "todos" && f.tipo !== tipo) continue;
    const nombre = nombreDeJuego(f.juego, f.tipo);
    if (!nombre) {
      fueraDeCatalogo += Number(f.respuestas) || 0;
      continue;
    }
    sumar(general, f);
    const j = porJuego.get(f.juego) || { juego: f.juego, tipo: f.tipo, nombre, ...vacio() };
    sumar(j, f);
    porJuego.set(f.juego, j);
    porDia.set(f.dia, (porDia.get(f.dia) || 0) + (Number(f.respuestas) || 0));
  }

  const juegos = [...porJuego.values()]
    .map((j) => ({ ...j, promedio: promedio(j.gusto) }))
    .sort((a, b) => b.promedio - a.promedio || b.total - a.total || a.nombre.localeCompare(b.nombre, "es"));

  const dias = [...porDia.entries()].map(([dia, total]) => ({ dia, total })).sort((a, b) => a.dia.localeCompare(b.dia));

  return { general: { ...general, promedio: promedio(general.gusto) }, juegos, dias, fueraDeCatalogo };
}

/** Días seguidos entre el primero y el último (los días sin respuestas van en 0). */
export function rellenarDias(dias) {
  if (!dias.length) return [];
  const mapa = new Map(dias.map((d) => [d.dia, d.total]));
  const salida = [];
  const fin = new Date(dias[dias.length - 1].dia + "T12:00:00Z");
  for (let d = new Date(dias[0].dia + "T12:00:00Z"); d <= fin; d = new Date(d.getTime() + 86_400_000)) {
    const k = d.toISOString().slice(0, 10);
    salida.push({ dia: k, total: mapa.get(k) || 0 });
  }
  return salida;
}

export const porcentaje = (n, total) => (total ? Math.round((n / total) * 100) : 0);

/** Tabla de resultados por juego en CSV (abre en Excel con acentos: lleva BOM y CRLF). */
export function csvResultados(resumen) {
  const celda = (v) => {
    const t = String(v ?? "");
    const seguro = /^[=+\-@]/.test(t) ? "'" + t : t;   // que Excel no lo tome como fórmula
    return /[",;\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
  };
  const filas = [[
    "Juego", "Tipo", "Respuestas", "Promedio (1 a 5)",
    ...ETIQUETAS_GUSTO.map((e) => e.texto), ...ETIQUETAS_DIFICULTAD.map((e) => e.texto), "% Justo",
  ]];
  for (const j of resumen.juegos) {
    filas.push([
      j.nombre, j.tipo === "mision" ? "Misiones" : "Minijuego", j.total, j.promedio.toFixed(2),
      ...j.gusto, ...j.dificultad, porcentaje(j.dificultad[1], j.total),
    ]);
  }
  return "﻿" + filas.map((f) => f.map(celda).join(",")).join("\r\n");
}
