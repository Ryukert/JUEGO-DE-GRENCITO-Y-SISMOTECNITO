/**
 * Azar para todos los juegos.
 *
 * `[...lista].sort(() => Math.random() - 0.5)` parece revolver, pero no lo
 * hace parejo: tiende a dejar las cosas cerca de donde estaban, y así la
 * respuesta buena sigue saliendo casi siempre en el mismo lugar. Aquí se
 * usa Fisher-Yates, que da todas las permutaciones con la misma
 * probabilidad.
 */

/** Copia revuelta de la lista. No toca la original. */
export function revolver(lista, azar = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Entero al azar entre 0 y n - 1. */
export function azar(n) {
  return Math.floor(Math.random() * n);
}

/** Un elemento al azar de la lista (o undefined si está vacía). */
export function elegir(lista) {
  return lista[azar(lista.length)];
}
