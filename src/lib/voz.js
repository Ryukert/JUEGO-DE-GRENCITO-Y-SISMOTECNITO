/**
 * Lectura en voz alta con la voz del navegador (Web Speech API).
 *
 * Pensado para primaria: muchos niños todavía leen despacio y se quedan
 * atorados en el texto, no en la idea. Sin archivos de audio ni servidor;
 * si el navegador no tiene voces, los botones de escuchar no aparecen.
 */

import { sonidoActivo } from "./sonido.js";

export function puedeLeer() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Busca una voz en español, de preferencia de México. */
function vozEspanol() {
  const voces = window.speechSynthesis.getVoices();
  return (
    voces.find((v) => v.lang === "es-MX") ||
    voces.find((v) => v.lang?.startsWith("es-US")) ||
    voces.find((v) => v.lang?.startsWith("es")) ||
    null
  );
}

/** Lee el texto, cortando lo que se estuviera leyendo antes. */
export function leer(texto) {
  if (!puedeLeer() || !texto) return;
  callar();
  // los emojis se leen como "cara sonriente..." y estorban
  const limpio = texto.replace(/\p{Extended_Pictographic}|️/gu, "").replace(/\s+/g, " ").trim();
  const frase = new window.SpeechSynthesisUtterance(limpio);
  const voz = vozEspanol();
  if (voz) frase.voice = voz;
  frase.lang = voz?.lang || "es-MX";
  frase.rate = 0.9; // un poco más despacio que lo normal
  window.speechSynthesis.speak(frase);
}

/** Lee solo si el sonido del juego está encendido (para la lectura automática). */
export function leerSiHaySonido(texto) {
  if (sonidoActivo()) leer(texto);
}

export function callar() {
  if (puedeLeer()) window.speechSynthesis.cancel();
}
