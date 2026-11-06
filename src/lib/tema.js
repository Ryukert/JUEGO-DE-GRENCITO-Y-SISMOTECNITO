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

/** Colores de las pantallas sin personaje (portada, Centro, editores), en claro y oscuro. */
export const TEMA_NEUTRO = {
  fondo: "#dbe9f8",
  fondo2: "#e8f3d6",
  tinta: "#10304f",
  acento: "#0f6fc4",
  acento2: "#c4500e",
  linea: "#8fb6dd",
  "acento-texto": "#0f6fc4",
  "acento2-texto": "#b0470c",
};

export const TEMA_NEUTRO_OSCURO = {
  fondo: "#0b1828",
  fondo2: "#122318",
  tinta: "#e8f1fa",
  acento: "#0f6fc4",
  acento2: "#c4500e",
  linea: "#2f4c6b",
  "acento-texto": "#7cc0ff",
  "acento2-texto": "#ffa36b",
};

/** Pone el tema en la página: data-tema para el CSS y los colores como variables. */
export function aplicarTema(tema, colores = tema === "oscuro" ? TEMA_NEUTRO_OSCURO : TEMA_NEUTRO) {
  const raiz = document.documentElement;
  raiz.dataset.tema = tema;
  Object.entries(colores).forEach(([k, v]) => raiz.style.setProperty(`--${k}`, v));
}
