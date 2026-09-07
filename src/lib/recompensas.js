/**
 * Sistema único de recompensas.
 *
 * Ningún minijuego calcula su propia economía: todos llaman a
 * `construirResultado` y reciben de vuelta el mismo objeto, con la forma
 * acordada para toda la plataforma:
 *
 *   { score, xp, livesLost, accuracy, completed, reward: { shields, seeds } }
 *
 * Además se conservan los campos en español que ya usaba el flujo de
 * misiones (`puntos`, `vidasRestantes`, `exito`, `resumen`) para que
 * `App.jsx` y `Juego.jsx` sigan funcionando exactamente igual.
 */

import { leerDificultad } from "./dificultad.js";

/**
 * @param {object} d
 * @param {number} d.puntos         puntos crudos que acumuló el jugador
 * @param {number} d.aciertos       respuestas / acciones correctas
 * @param {number} d.total          total de intentos posibles
 * @param {string} d.dificultad     "facil" | "medio" | "dificil"
 * @param {number} d.vidasIniciales corazones con los que arrancó
 * @param {number} d.vidasRestantes corazones que le quedan
 * @param {boolean} d.completado    si terminó el reto o se quedó en el camino
 * @param {string} d.familia        "tecnito" | "greencito" | "general"
 * @param {string} d.resumen        frase corta para la pantalla final
 */
export function construirResultado({
  puntos = 0,
  aciertos = 0,
  total = 0,
  dificultad = "medio",
  vidasIniciales = 3,
  vidasRestantes = 3,
  completado = true,
  familia = "general",
  resumen = "",
} = {}) {
  const dif = leerDificultad(dificultad);
  const precision = total > 0 ? Math.round((aciertos / total) * 100) : completado ? 100 : 0;
  const vidasPerdidas = Math.max(0, vidasIniciales - vidasRestantes);

  // El premio por dificultad y el bono por no perder vidas se aplican solo
  // si de verdad terminó el reto. Rendirse a la mitad no paga igual.
  const bonoPerfecto = completado && vidasPerdidas === 0 && precision >= 90 ? 1.2 : 1;
  const score = Math.max(0, Math.round(puntos * dif.premio * bonoPerfecto));

  const xp = Math.round(score / 6) + (completado ? 10 : 0) + (precision >= 90 ? 12 : 0);

  // Tecnito paga escudos, Greencito paga semillas, los generales reparten.
  const moneda = Math.round(score / 10) + (completado ? 5 : 0);
  const reward =
    familia === "tecnito"
      ? { shields: moneda, seeds: 0 }
      : familia === "greencito"
        ? { shields: 0, seeds: moneda }
        : { shields: Math.round(moneda / 2), seeds: Math.round(moneda / 2) };

  return {
    // contrato nuevo, compartido por todos los minijuegos
    score,
    xp,
    livesLost: vidasPerdidas,
    accuracy: precision,
    completed: completado,
    reward,
    dificultad,
    // contrato viejo, el que ya esperaba el flujo de misiones
    puntos: score,
    vidasRestantes: Math.max(0, vidasRestantes),
    exito: completado,
    resumen: resumen || frase(aciertos, total, completado),
  };
}

function frase(aciertos, total, completado) {
  if (!completado) return "Se quedó a medio camino, pero algo aprendió.";
  if (total > 0) return `Acertó ${aciertos} de ${total}.`;
  return "Reto completado.";
}

/** Estrellas de la pantalla de resultado (0 a 3). */
export function estrellas(resultado) {
  if (!resultado.completed) return 0;
  if (resultado.accuracy >= 90 && resultado.livesLost === 0) return 3;
  if (resultado.accuracy >= 65) return 2;
  return 1;
}

/**
 * Puntos por acierto, con bono por rapidez y por racha.
 * Lo usan casi todos los motores para no reinventar la fórmula.
 */
export function puntosAcierto({ base = 15, tiempo = 0, factorTiempo = 2, racha = 0 }) {
  const multiplicador = racha >= 4 ? 3 : racha >= 2 ? 2 : 1;
  return Math.round((base + tiempo * factorTiempo) * multiplicador);
}
