import { useState, useEffect, useRef } from "react";
import Icono from "./Icono.jsx";
import { sonido } from "../lib/sonido.js";

/**
 * Explicación de 3 pasos antes de la primera partida. La da el personaje
 * elegido; se puede saltar y volver a ver desde Ajustes.
 */
const PASOS = [
  {
    icono: "reloj",
    titulo: "Responde antes de que se acabe el reloj",
    texto: "Verde: vas bien. Amarillo: ya va a la mitad. Rojo: ¡apúrate!",
  },
  {
    icono: "fuego",
    titulo: "Encadena aciertos y haz racha",
    texto: "Con dos aciertos seguidos tus puntos valen doble; con cuatro, triple.",
  },
  {
    icono: "corazon",
    titulo: "Tienes tres vidas",
    texto: "Si te equivocas no pasa nada: lee la explicación, así se aprende.",
  },
];

export default function Tutorial({ personaje: p, onFin }) {
  const [paso, setPaso] = useState(0);
  const siguienteRef = useRef(null);
  const ultimo = paso === PASOS.length - 1;
  const actual = PASOS[paso];

  useEffect(() => {
    siguienteRef.current?.focus({ preventScroll: true });
  }, [paso]);

  function avanzar() {
    sonido.clic();
    if (ultimo) onFin();
    else setPaso((n) => n + 1);
  }

  return (
    <div className="pantalla tutorial" role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo">
      <img className="tutorial__figura flota" src={p.cuerpo} alt="" />
      <div className="tutorial__globo" key={paso}>
        <Icono nombre={actual.icono} className={`tutorial__icono tutorial__icono--${actual.icono}`} />
        <h2 id="tutorial-titulo">{actual.titulo}</h2>
        <p>{actual.texto}</p>
        {ultimo && (
          <p className="tutorial__atajos">
            En computadora: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> o <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> para
            responder y <kbd>Enter</kbd> para seguir.
          </p>
        )}
      </div>
      <div className="tutorial__puntos" aria-label={`Paso ${paso + 1} de ${PASOS.length}`}>
        {PASOS.map((_, i) => (
          <span key={i} className={i === paso ? "on" : ""} />
        ))}
      </div>
      <div className="tutorial__botones">
        {!ultimo && (
          <button className="tutorial__saltar" onClick={onFin}>
            Saltar
          </button>
        )}
        <button className="boton-grande" onClick={avanzar} ref={siguienteRef}>
          {ultimo ? "¡A jugar!" : "Siguiente"} <Icono nombre="siguiente" />
        </button>
      </div>
    </div>
  );
}
