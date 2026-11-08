/**
 * Repasar lo que falló: las preguntas de misión que el jugador ha fallado y todavía no
 * contesta bien. Los contadores viven en el progreso (`repaso.fallos` y `repaso.dominadas`,
 * ver src/lib/progreso.js → registrarRespuesta), así que cada jugador de la computadora y cada
 * alumno de un grupo tiene su propio repaso, y el del alumno viaja con su progreso.
 */
import { PERSONAJES, buscarReto } from "../data/personajes.js";

/** Cuántas preguntas trae cada ronda de repaso. */
export const POR_RONDA = 5;

/**
 * Lo pendiente, de lo más fallado a lo menos: [{ clave, personaje, reto, bono, pendientes }].
 * Lo que ya no exista en el contenido del juego se ignora.
 */
export function pendientesDeRepaso(progreso) {
  const fallos = progreso?.repaso?.fallos || {};
  const dominadas = progreso?.repaso?.dominadas || {};
  const lista = [];
  for (const [clave, n] of Object.entries(fallos)) {
    const pendientes = n - (dominadas[clave] || 0);
    if (pendientes <= 0) continue;
    const [personaje, id, b] = clave.split(":");
    const reto = buscarReto(PERSONAJES[personaje], id);
    if (!reto) continue;
    const bono = b === "b";
    if (bono && !reto.retoSecundaria) continue;
    lista.push({ clave, personaje, reto, bono, pendientes });
  }
  return lista.sort((a, b) => b.pendientes - a.pendientes || a.clave.localeCompare(b.clave));
}

/**
 * La pregunta tal como la espera <Reto>: si era la de bonificación, se vuelve la pregunta
 * principal (sin otra bonificación detrás).
 */
export function preguntaDeRepaso({ reto, bono }) {
  if (!bono) {
    const { retoSecundaria: _sinBono, ...principal } = reto;
    return principal;
  }
  const s = reto.retoSecundaria;
  return {
    id: reto.id,
    tipo: "reto",
    titulo: reto.titulo,
    lugar: reto.lugar,
    escenario: s.pregunta.replace(/^Nivel experto:\s*/i, ""),
    opciones: s.opciones,
    explicacion: s.explicacion,
    dato: reto.dato,
  };
}
