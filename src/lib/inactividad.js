import { useEffect, useRef } from "react";

/**
 * Reinicio por inactividad para la computadora del salón: si nadie toca la pantalla en
 * MINUTOS_INACTIVIDAD, el juego vuelve a la portada y pide el nombre otra vez, para que el
 * siguiente niño no siga con el nombre (y el progreso) del anterior.
 *
 * AVISO_SEGUNDOS antes se avisa («¿Sigues jugando?»); cualquier toque, tecla o movimiento de
 * la rueda cuenta como actividad y reinicia la cuenta. Si la pestaña estuvo oculta más del
 * límite, al volver se reinicia de inmediato.
 */
export const MINUTOS_INACTIVIDAD = 5;
export const AVISO_SEGUNDOS = 30;

const EVENTOS = ["pointerdown", "keydown", "wheel", "touchstart"];

/**
 * activo: si está apagado no cuenta nada.
 * onAviso(segundosQueQuedan) se llama al empezar el aviso; onActividad() cuando alguien vuelve
 * a tocar durante el aviso; onVencer() al cumplirse el tiempo.
 */
export function usarInactividad({ activo = true, ms = MINUTOS_INACTIVIDAD * 60_000, avisoMs = AVISO_SEGUNDOS * 1000, onAviso, onActividad, onVencer }) {
  const llamadas = useRef({ onAviso, onActividad, onVencer });
  llamadas.current = { onAviso, onActividad, onVencer };

  useEffect(() => {
    if (!activo) return;
    let ultimo = Date.now();
    let avisando = false;
    let tAviso = null, tVence = null;

    const programar = () => {
      clearTimeout(tAviso);
      clearTimeout(tVence);
      tAviso = setTimeout(() => {
        avisando = true;
        llamadas.current.onAviso?.(Math.round(avisoMs / 1000));
      }, Math.max(0, ms - avisoMs));
      tVence = setTimeout(vencer, ms);
    };
    const vencer = () => {
      avisando = false;
      clearTimeout(tAviso);
      clearTimeout(tVence);
      llamadas.current.onVencer?.();
      ultimo = Date.now();
      programar();
    };
    const actividad = () => {
      ultimo = Date.now();
      if (avisando) {
        avisando = false;
        llamadas.current.onActividad?.();
      }
      programar();
    };
    const alVolver = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - ultimo >= ms) vencer();
    };

    programar();
    EVENTOS.forEach((e) => window.addEventListener(e, actividad, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(tAviso);
      clearTimeout(tVence);
      EVENTOS.forEach((e) => window.removeEventListener(e, actividad, { capture: true }));
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [activo, ms, avisoMs]);
}
