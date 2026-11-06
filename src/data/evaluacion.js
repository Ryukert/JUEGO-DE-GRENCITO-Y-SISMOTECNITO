/**
 * Evaluación al maestro: tres preguntas con cinco caritas, de rojo (1) a verde (5).
 * La usan el juego (formulario y panel) y el servidor (api/evaluacion.js), así que si se
 * cambia una pregunta aquí, cambia en todos lados.
 *
 * Emojis de antes de 2019, para que se vean en los equipos viejos de las escuelas.
 */

export const ESCALA = [
  { valor: 1, emoji: "😡", etiqueta: "Nada", color: "#d63a2a" },
  { valor: 2, emoji: "🙁", etiqueta: "Poco", color: "#ee7a1c" },
  { valor: 3, emoji: "😐", etiqueta: "Más o menos", color: "#f1c22e" },
  { valor: 4, emoji: "🙂", etiqueta: "Bien", color: "#8cc540" },
  { valor: 5, emoji: "😄", etiqueta: "¡Muy bien!", color: "#2c9c48" },
];

export const PREGUNTAS = [
  { id: "explica", texto: "¿Tu maestro explica claro?", corto: "Explica claro" },
  { id: "divierte", texto: "¿Te gustó la clase?", corto: "Les gusta la clase" },
  { id: "aprendo", texto: "¿Aprendiste algo nuevo?", corto: "Aprenden algo nuevo" },
];

/** Con menos de estas evaluaciones el maestro no ve resultados: así nadie adivina quién votó. */
export const MINIMO_ANONIMO = 3;

/** 3.6 → la carita más cercana (la de 4). */
export const caritaDe = (promedio) => ESCALA[Math.min(4, Math.max(0, Math.round(promedio) - 1))];

export const valorValido = (v) => Number.isInteger(v) && v >= 1 && v <= 5;

/* ---------------- encuesta de satisfacción de cada juego ---------------- */

/** «¿Te gustó?» usa las caritas de ESCALA. «¿Cómo estuvo de difícil?» usa estas tres. */
export const DIFICULTAD = [
  { valor: 1, emoji: "😴", etiqueta: "Muy fácil", color: "#5aa9e6" },
  { valor: 2, emoji: "👌", etiqueta: "Justo", color: "#8cc540" },
  { valor: 3, emoji: "😰", etiqueta: "Muy difícil", color: "#9b6fd6" },
];

/** Identificador de la encuesta: el id del minijuego, o «mision-sismo» / «mision-green». */
export const ID_ENCUESTA = /^[a-z0-9-]{1,40}$/;
export const encuestaValida = (e) =>
  !!e &&
  ID_ENCUESTA.test(String(e.juego)) &&
  (e.tipo === "minijuego" || (e.tipo === "mision" && /^mision-(sismo|green)$/.test(e.juego))) &&
  valorValido(e.gusto) &&
  Number.isInteger(e.dificultad) && e.dificultad >= 1 && e.dificultad <= 3;
