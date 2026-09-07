/**
 * Dificultad de los minijuegos.
 *
 * No cambia solo "qué tan difícil es la pregunta": cambia el tiempo, la
 * cantidad de objetos en pantalla, el ritmo y el número de opciones. Cada
 * motor lee estos factores y los aplica a su manera.
 *
 *   tiempo    → multiplica los segundos base (más alto = más tiempo)
 *   objetos   → multiplica la cantidad de elementos en pantalla
 *   rondas    → multiplica el número de preguntas / rondas
 *   opciones  → cuántas respuestas se muestran en los motores de quiz
 *   ritmo     → multiplica la velocidad de aparición (más alto = más lento)
 *   vidas     → corazones con los que arranca el minijuego
 *   premio    → multiplica los puntos finales
 */

export const DIFICULTADES = {
  facil: {
    id: "facil",
    nombre: "Fácil",
    icono: "🟢",
    para: "Primaria",
    tiempo: 1.4,
    objetos: 0.7,
    rondas: 0.7,
    opciones: 3,
    ritmo: 1.3,
    vidas: 4,
    premio: 1,
  },
  medio: {
    id: "medio",
    nombre: "Medio",
    icono: "🟡",
    para: "Ya le sabes",
    tiempo: 1,
    objetos: 1,
    rondas: 1,
    opciones: 4,
    ritmo: 1,
    vidas: 3,
    premio: 1.35,
  },
  dificil: {
    id: "dificil",
    nombre: "Difícil",
    icono: "🔴",
    para: "Secundaria",
    tiempo: 0.72,
    objetos: 1.3,
    rondas: 1.3,
    opciones: 4,
    ritmo: 0.72,
    vidas: 2,
    premio: 1.8,
  },
};

export const LISTA_DIFICULTADES = Object.values(DIFICULTADES);

/** Dificultad sugerida a partir del grado escolar elegido en la portada. */
export function dificultadPorGrado(grado) {
  return grado === "secundaria" ? "dificil" : "facil";
}

export function leerDificultad(id) {
  return DIFICULTADES[id] || DIFICULTADES.medio;
}

/** Segundos ajustados a la dificultad, con un mínimo razonable. */
export function segundos(dif, base, minimo = 3) {
  return Math.max(minimo, Math.round(base * dif.tiempo * 10) / 10);
}

/** Cantidad de elementos ajustada a la dificultad. */
export function cuantos(dif, base, minimo = 1, maximo = 99) {
  return Math.min(maximo, Math.max(minimo, Math.round(base * dif.objetos)));
}

/** Número de rondas / preguntas ajustado a la dificultad. */
export function cuantasRondas(dif, base, minimo = 3, maximo = 30) {
  return Math.min(maximo, Math.max(minimo, Math.round(base * dif.rondas)));
}
