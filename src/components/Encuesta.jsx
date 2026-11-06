import { useState, useEffect } from "react";
import { DIFICULTAD } from "../data/evaluacion.js";
import { encuestasDisponibles, tocaPreguntar, marcarPreguntado, enviarEncuesta } from "../lib/encuestas.js";
import { sonido } from "../lib/sonido.js";
import { Caritas } from "./Evaluacion.jsx";

/**
 * Encuesta de satisfacción al terminar un juego: «¿Te gustó?» con caritas de rojo a verde y
 * «¿Cómo estuvo de difícil?» con tres opciones. Al tocar las dos se manda sola, sin botón.
 * Sale una vez al día por juego, y solo si el servidor tiene base de datos.
 *
 * juego: { id, tipo: "minijuego" | "mision", nombre }
 */
export default function Encuesta({ juego, grado }) {
  const [visible, setVisible] = useState(false);
  const [gusto, setGusto] = useState(null);
  const [dificultad, setDificultad] = useState(null);
  const [gracias, setGracias] = useState(false);

  useEffect(() => {
    let vivo = true;
    if (!tocaPreguntar(juego.id)) return;
    encuestasDisponibles().then((si) => vivo && si && setVisible(true));
    return () => { vivo = false; };
  }, [juego.id]);

  // con las dos respuestas, se manda sola
  useEffect(() => {
    if (!gusto || !dificultad || gracias) return;
    setGracias(true);
    sonido.moneda?.();
    enviarEncuesta({ juego: juego.id, tipo: juego.tipo, gusto, dificultad, grado });
  }, [gusto, dificultad, gracias, juego, grado]);

  if (!visible) return null;

  if (gracias) {
    return (
      <section className="encuesta encuesta--lista" role="status">
        <span aria-hidden="true">💚</span> ¡Gracias! Con tu opinión mejoramos {juego.nombre}.
      </section>
    );
  }

  return (
    <section className="encuesta" aria-labelledby={`enc-${juego.id}`}>
      <header className="encuesta__cabeza">
        <h3 id={`enc-${juego.id}`}>¿Qué te pareció {juego.nombre}?</h3>
        <button
          type="button"
          className="encuesta__no"
          onClick={() => {
            marcarPreguntado(juego.id);
            setVisible(false);
          }}
        >
          Ahora no
        </button>
      </header>

      <Caritas
        nombre={`enc-gusto-${juego.id}`}
        titulo="¿Te gustó?"
        valor={gusto}
        onCambiar={(v) => { sonido.clic(); setGusto(v); }}
      />

      <fieldset className="caritas" aria-labelledby={`enc-dif-${juego.id}`}>
        <legend id={`enc-dif-${juego.id}`}>¿Cómo estuvo de difícil?</legend>
        <div className="caritas__fila caritas__fila--tres">
          {DIFICULTAD.map((c) => (
            <label
              key={c.valor}
              className={`carita ${dificultad === c.valor ? "carita--elegida" : ""} ${dificultad && dificultad !== c.valor ? "carita--apagada" : ""}`}
              style={{ "--carita": c.color }}
            >
              <input
                type="radio"
                name={`enc-dif-${juego.id}`}
                value={c.valor}
                checked={dificultad === c.valor}
                onChange={() => { sonido.clic(); setDificultad(c.valor); }}
              />
              <span className="carita__cara" aria-hidden="true">{c.emoji}</span>
              <span className="carita__texto">{c.etiqueta}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
