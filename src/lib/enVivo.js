/**
 * Modo en vivo de la ventana de administración: las encuestas se vuelven a pedir solas cada
 * CADA milisegundos mientras la pestaña está a la vista, y se marca qué llegó de nuevo.
 */
import { useEffect, useRef } from "react";

export const CADA = 30_000;          // cada cuánto se actualizan las gráficas
export const RESALTE = 8_000;        // cuánto dura iluminado lo que llegó de nuevo

/** Total de respuestas y respuestas por juego de las filas que da /api/editores. */
export function totales(filas) {
  const porJuego = {};
  let total = 0;
  for (const f of filas || []) {
    const n = Number(f.respuestas) || 0;
    total += n;
    porJuego[f.juego] = (porJuego[f.juego] || 0) + n;
  }
  return { total, porJuego };
}

/** Qué cambió entre dos lecturas: cuántas respuestas nuevas y en qué juegos. */
export function novedades(antes, despues) {
  if (!antes) return { nuevas: 0, juegos: [] };
  const a = totales(antes), d = totales(despues);
  const juegos = Object.keys(d.porJuego).filter((j) => d.porJuego[j] > (a.porJuego[j] || 0));
  return { nuevas: Math.max(0, d.total - a.total), juegos };
}

/** «hace 12 s», «hace 3 min»… */
export function haceCuanto(desde, ahora = Date.now()) {
  if (!desde) return "";
  const s = Math.max(0, Math.round((ahora - desde) / 1000));
  if (s < 5) return "justo ahora";
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  return m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`;
}

/**
 * Llama a `actualizar` cada `cada` ms mientras `activo` y la pestaña esté visible; al volver a
 * la pestaña actualiza en seguida. `documento` se puede cambiar en las pruebas.
 */
export function useEnVivo(actualizar, { activo = true, cada = CADA, documento = typeof document !== "undefined" ? document : null } = {}) {
  const ultima = useRef(actualizar);
  ultima.current = actualizar;

  useEffect(() => {
    if (!activo || !documento) return undefined;
    const tic = () => {
      if (!documento.hidden) ultima.current();
    };
    const id = setInterval(tic, cada);
    const alVolver = () => {
      if (!documento.hidden) ultima.current();
    };
    documento.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      documento.removeEventListener("visibilitychange", alVolver);
    };
  }, [activo, cada, documento]);
}
