/**
 * Evaluación abierta (/opinion): como la pantalla de un restaurante que pregunta «¿te gustó la
 * comida?, ¿cómo fue el trato?». Cualquiera contesta tocando caritas, sin correo, código ni PIN.
 * La usan la página (src/pages/Opinion.jsx), el servidor (api/opinion.js) y la administración;
 * si se cambia una pregunta aquí, cambia en todos lados (la base de datos guarda los ids).
 *
 * Mismas caritas y colores que la evaluación al maestro (src/data/evaluacion.js), con palabras
 * que sirven para las tres preguntas.
 */
import { ESCALA } from "./evaluacion.js";

export const ESCALA_OPINION = ESCALA.map((c, i) => ({
  ...c,
  etiqueta: ["Muy mal", "Mal", "Regular", "Bien", "Excelente"][i],   // sin «¡!»: en 320 px se partía
}));

export const PREGUNTAS_OPINION = [
  { id: "juego", texto: "¿Qué te pareció el juego?", corto: "El juego" },
  { id: "trato", texto: "¿Cómo te atendieron?", corto: "El trato" },
  { id: "explicacion", texto: "¿Cómo te explicaron?", corto: "La explicación" },
];

/** Opcional: quién contesta, para saber de quién es cada opinión (no se pide nada más). */
export const QUIENES = [
  { id: "alumno", texto: "Alumno o alumna" },
  { id: "maestro", texto: "Maestro o maestra" },
  { id: "familia", texto: "Mamá, papá o familiar" },
  { id: "otro", texto: "Otra persona" },
];

const valor = (v) => Number.isInteger(v) && v >= 1 && v <= 5;

export const opinionValida = (o) =>
  !!o && PREGUNTAS_OPINION.every((p) => valor(o[p.id])) &&
  (o.quien == null || QUIENES.some((q) => q.id === o.quien));
