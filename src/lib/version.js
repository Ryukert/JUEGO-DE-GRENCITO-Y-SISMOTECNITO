/**
 * ¿Hay una versión nueva publicada?
 *
 * En el salón la página se queda abierta horas y nunca se recarga, así que las mejoras no
 * llegaban. Cada REVISAR_CADA se pide el index.html (sin caché, unos pocos KB) y se compara el
 * nombre del script principal: Vite le pone un hash distinto en cada versión. Si cambió, el
 * juego se recarga en el próximo momento en que nadie está jugando (el reinicio por inactividad).
 */
export const REVISAR_CADA = 10 * 60_000;

const PATRON = /\/assets\/index-[\w-]+\.js/;
let nueva = false;

/** El script principal de la página que está corriendo (null en desarrollo). */
export function scriptActual(doc = typeof document !== "undefined" ? document : null) {
  const s = doc?.querySelector?.('script[type="module"][src*="/assets/index-"]');
  const m = s?.getAttribute("src")?.match(PATRON);
  return m ? m[0] : null;
}

/** Pide el index.html publicado y dice si su script principal es otro. */
export async function revisarVersion({ actual = scriptActual(), pedir = fetch } = {}) {
  if (!actual || nueva) return nueva;
  try {
    const r = await pedir("/", { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) return nueva;
    const m = (await r.text()).match(PATRON);
    if (m && m[0] !== actual) nueva = true;
  } catch {
    /* sin internet: se vuelve a intentar después */
  }
  return nueva;
}

export const hayVersionNueva = () => nueva;

/** Revisa cada REVISAR_CADA y al volver el internet. Devuelve cómo dejar de revisar. */
export function iniciarRevisionDeVersion() {
  if (!scriptActual()) return () => {};
  const id = setInterval(() => revisarVersion(), REVISAR_CADA);
  const alVolver = () => revisarVersion();
  window.addEventListener("online", alVolver);
  return () => {
    clearInterval(id);
    window.removeEventListener("online", alVolver);
  };
}

/** Solo para pruebas. */
export function reiniciarVersion() {
  nueva = false;
}
