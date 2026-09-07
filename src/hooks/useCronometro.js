import { useState, useEffect, useRef } from "react";
import { sonido } from "../lib/sonido.js";

/**
 * Cronómetro descendente para minijuegos.
 *
 * Limpia su intervalo al desmontar y al pausarse, así que un juego que se
 * abandona a la mitad no deja timers corriendo en segundo plano.
 *
 * @param {boolean} activo      corre solo cuando es true
 * @param {number}  segundos    duración total
 * @param {number}  reinicio    cambia este número para reiniciar la cuenta
 * @param {Function} alTerminar se llama una sola vez al llegar a cero
 * @param {boolean} tic         suena el tic-tac de los últimos segundos
 */
export function useCronometro({ activo, segundos, reinicio = 0, alTerminar, tic = true }) {
  const [tiempo, setTiempo] = useState(segundos);
  const finRef = useRef(alTerminar);
  const disparado = useRef(false);

  finRef.current = alTerminar;

  useEffect(() => {
    disparado.current = false;
    setTiempo(segundos);
  }, [segundos, reinicio]);

  useEffect(() => {
    if (!activo) return undefined;
    const id = setInterval(() => {
      setTiempo((t) => Math.max(0, +(t - 0.1).toFixed(1)));
    }, 100);
    return () => clearInterval(id);
  }, [activo, segundos, reinicio]);

  useEffect(() => {
    if (!activo) return;
    if (tiempo <= 0) {
      if (disparado.current) return;
      disparado.current = true;
      finRef.current?.();
    } else if (tic && tiempo <= 3 && Math.abs(tiempo % 1) < 0.05) {
      sonido.tic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempo, activo]);

  return tiempo;
}

/**
 * setTimeout que se cancela solo al desmontar el componente.
 * Evita que un "siguiente pregunta" dispare después de salir del juego.
 */
export function useTemporizadores() {
  const ids = useRef([]);

  useEffect(
    () => () => {
      ids.current.forEach(clearTimeout);
      ids.current = [];
    },
    []
  );

  return (fn, ms) => {
    const id = setTimeout(fn, ms);
    ids.current.push(id);
    return id;
  };
}
