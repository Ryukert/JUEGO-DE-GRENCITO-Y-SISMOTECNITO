import { useState, useEffect } from "react";
import { ESCALA, PREGUNTAS } from "../data/evaluacion.js";
import { evaluacionDeHoy, enviarEvaluacion } from "../lib/cuenta.js";
import { sonido } from "../lib/sonido.js";
import { confeti } from "../lib/confeti.js";

/**
 * El alumno evalúa a su maestro: tres preguntas, cinco caritas de rojo a verde.
 * Son botones de radio de verdad (se eligen con flechas y Tab), pintados como caritas.
 * Anónima: el maestro solo ve promedios.
 */

/** Una fila de cinco caritas, de 😡 rojo a 😄 verde. */
export function Caritas({ nombre, titulo, valor, onCambiar }) {
  const idTitulo = `ev-${nombre}`;
  return (
    <fieldset className="caritas" aria-labelledby={idTitulo}>
      <legend id={idTitulo}>{titulo}</legend>
      <div className="caritas__fila">
        {ESCALA.map((c) => (
          <label
            key={c.valor}
            className={`carita ${valor === c.valor ? "carita--elegida" : ""} ${valor && valor !== c.valor ? "carita--apagada" : ""}`}
            style={{ "--carita": c.color }}
          >
            <input
              type="radio"
              name={nombre}
              value={c.valor}
              checked={valor === c.valor}
              onChange={() => onCambiar(c.valor)}
            />
            <span className="carita__cara" aria-hidden="true">{c.emoji}</span>
            <span className="carita__texto">{c.etiqueta}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Evaluacion({ onVolver }) {
  const [valores, setValores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [yaHabia, setYaHabia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    evaluacionDeHoy()
      .then((hoy) => {
        if (!vivo || !hoy) return;
        setValores(hoy);
        setYaHabia(true);
      })
      .catch(() => {})
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, []);

  const completas = PREGUNTAS.every((p) => valores[p.id]);

  async function enviar(e) {
    e.preventDefault();
    if (!completas) return setError("Elige una carita en cada pregunta.");
    setError("");
    setEnviando(true);
    try {
      await enviarEvaluacion(valores);
      sonido.bien();
      confeti({ colores: ESCALA.map((c) => c.color), cantidad: 40 });
      setListo(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="evaluacion evaluacion--lista" role="status">
        <span className="evaluacion__gracias" aria-hidden="true">💚</span>
        <p><strong>¡Gracias!</strong> Tu maestro verá cómo le fue al grupo, pero no sabrá qué elegiste tú.</p>
        <button type="button" className="boton-grande" onClick={onVolver}>Listo</button>
      </div>
    );
  }

  return (
    <form className="evaluacion" onSubmit={enviar}>
      <p className="cuenta__nota">
        Es secreto: tu maestro solo ve el promedio del grupo. Puedes cambiar tu respuesta durante el día.
      </p>
      {cargando ? (
        <p role="status">Un momento…</p>
      ) : (
        PREGUNTAS.map((p) => (
          <Caritas
            key={p.id}
            nombre={p.id}
            titulo={p.texto}
            valor={valores[p.id]}
            onCambiar={(v) => {
              sonido.clic();
              setValores((a) => ({ ...a, [p.id]: v }));
            }}
          />
        ))
      )}
      {error && <p className="cuenta__error" role="alert">{error}</p>}
      <button className="boton-grande" type="submit" disabled={enviando || cargando}>
        {enviando ? "Enviando…" : yaHabia ? "Cambiar mi evaluación" : "Enviar mi evaluación"}
      </button>
      <button type="button" className="cuenta__salir" onClick={onVolver}>Volver</button>
    </form>
  );
}
