import { useEffect } from "react";

/**
 * Atajos de teclado para jugar sin mouse (salón con proyector, computadora):
 *
 *   1-4 o A-D  elige la respuesta con esa letra (solo botones con su letra,
 *              así no choca con las flechas / WASD del laberinto)
 *   Enter      sigue: aprieta el botón principal visible si nada tiene el foco
 *
 * No hace nada mientras se escribe en un campo de texto.
 */
export function manejarTecla(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;

  const k = (e.key || "").toLowerCase();
  const indice = k.length === 1 ? Math.max("1234".indexOf(k), "abcd".indexOf(k)) : -1;
  if (indice >= 0) {
    const respuestas = [...document.querySelectorAll(".opciones button")].filter(
      (b) => !b.disabled && b.querySelector(".opciones__letra")
    );
    if (respuestas[indice]) {
      e.preventDefault();
      respuestas[indice].click();
    }
    return;
  }

  if (e.key === "Enter" && (!t || t === document.body || t === document.documentElement)) {
    const principal = document.querySelector(".boton-grande:not(:disabled)");
    if (principal) {
      e.preventDefault();
      principal.click();
    }
  }
}

export function usarAtajos(activos = true) {
  useEffect(() => {
    if (!activos) return;
    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [activos]);
}
