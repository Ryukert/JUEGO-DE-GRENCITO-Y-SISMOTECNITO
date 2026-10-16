/**
 * Tema claro / oscuro.
 *
 * Mientras nadie toque el botón, el juego sigue lo que diga el sistema
 * (prefers-color-scheme). Al tocarlo, la elección se guarda en este navegador
 * y manda sobre la del sistema. Si el almacenamiento está bloqueado, la
 * elección dura lo que dure la página.
 */

const LLAVE = "escuadron-tema";
let enMemoria = null;

/** "claro" | "oscuro" | null (null = seguir al sistema). */
export function temaGuardado() {
  try {
    const v = localStorage.getItem(LLAVE);
    return v === "claro" || v === "oscuro" ? v : null;
  } catch (e) {
    return enMemoria; // sin almacenamiento
  }
}

export function guardarTema(tema) {
  try {
    localStorage.setItem(LLAVE, tema);
  } catch (e) {
    enMemoria = tema; // sin almacenamiento: dura lo que la página
  }
}

export function sistemaOscuro() {
  try {
    return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    return false;
  }
}

export function temaInicial() {
  return temaGuardado() || (sistemaOscuro() ? "oscuro" : "claro");
}
