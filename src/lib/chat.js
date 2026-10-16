/**
 * ¿Está encendido el chat con los personajes?
 *
 * Se pregunta una sola vez al servidor (GET /api/chat, no gasta nada). Si no
 * hay conexión o falta la llave, el juego esconde el campo «Pregúntale algo»
 * en vez de dejar al niño escribiendo sin que nadie conteste.
 */

let consulta = null;
let apagado = false;

export function chatDisponible() {
  if (apagado) return Promise.resolve(false);
  if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.resolve(false);
  if (!consulta) {
    consulta = fetch("/api/chat", { method: "GET" })
      .then((r) => (r.ok ? r.json() : { disponible: false }))
      .then((d) => !!d?.disponible)
      .catch(() => false);
  }
  return consulta;
}

/** Una respuesta 503 a media partida apaga el chat el resto de la visita. */
export function marcarChatApagado() {
  apagado = true;
}

/** Para pruebas. */
export function reiniciarChat() {
  consulta = null;
  apagado = false;
}
