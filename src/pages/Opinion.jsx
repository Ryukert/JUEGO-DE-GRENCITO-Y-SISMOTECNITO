import { useState, useEffect, useRef } from "react";
import { PREGUNTAS_OPINION, ESCALA_OPINION, QUIENES } from "../data/opinion.js";
import { enviarOpinion } from "../lib/opiniones.js";
import { Caritas } from "../components/Evaluacion.jsx";
import { Escuchar } from "../juegos/ui/Marco.jsx";
import { PERSONAJES } from "../data/personajes.js";
import { temaInicial, aplicarTema } from "../lib/tema.js";
import { sonido } from "../lib/sonido.js";
import { confeti } from "../lib/confeti.js";

/**
 * Evaluación abierta (/opinion, /evaluacion, /califica): como la pantalla de un restaurante que
 * pregunta «¿te gustó la comida?, ¿cómo fue el trato?». Cualquier persona contesta tocando
 * caritas: sin correo, sin código, sin PIN. Se puede dejar abierta en una tableta: después de
 * cada respuesta da las gracias y en unos segundos queda lista para la siguiente persona.
 */

export const SEGUNDOS_GRACIAS = 6;
const VACIA = () => ({ juego: null, trato: null, explicacion: null, quien: null });
const LEER =
  "¿Qué te pareció? Toca una carita en cada pregunta: la roja es muy mal y la verde es excelente. " +
  PREGUNTAS_OPINION.map((p) => p.texto).join(" ") + " Al final toca Enviar.";

/**
 * Pantalla completa para dejarla en una tableta: sin la barra del navegador, la pantalla no se
 * apaga (Wake Lock, donde exista) y se esconde «Ir al juego» para que nadie se salga.
 * En el iPhone el navegador no deja pantalla completa: ahí el botón no aparece.
 */
function usePantallaCompleta() {
  const se = typeof document !== "undefined" && !!document.fullscreenEnabled && !!document.documentElement.requestFullscreen;
  const [activa, setActiva] = useState(false);
  const candado = useRef(null);
  useEffect(() => {
    if (!se) return undefined;
    const cambio = async () => {
      const ahora = !!document.fullscreenElement;
      setActiva(ahora);
      try {
        if (ahora && navigator.wakeLock) candado.current = await navigator.wakeLock.request("screen");
        else if (!ahora) { await candado.current?.release(); candado.current = null; }
      } catch { /* sin Wake Lock: la pantalla se apaga sola como siempre */ }
    };
    document.addEventListener("fullscreenchange", cambio);
    return () => {
      document.removeEventListener("fullscreenchange", cambio);
      candado.current?.release().catch(() => {});
    };
  }, [se]);
  const alternar = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  return { se, activa, alternar };
}

function BotonCompleta({ completa }) {
  if (!completa.se) return null;
  return (
    <button type="button" className="escuchar opinion__completa" onClick={completa.alternar} aria-pressed={completa.activa}>
      {completa.activa ? "Salir de pantalla completa" : "Pantalla completa"}
    </button>
  );
}

export default function Opinion() {
  const completa = usePantallaCompleta();
  const [valores, setValores] = useState(VACIA);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [gracias, setGracias] = useState(null);   // segundos que faltan para la siguiente persona
  const titulo = useRef(null);

  useEffect(() => {
    document.title = "¿Qué te pareció? · Escuadrón Tecnito y Greencito";
    aplicarTema(temaInicial());
  }, []);

  // cuenta regresiva de las gracias; al llegar a cero, queda lista para la siguiente persona
  useEffect(() => {
    if (gracias === null) return undefined;
    if (gracias <= 0) {
      setGracias(null);
      setValores(VACIA());
      titulo.current?.focus();
      return undefined;
    }
    const t = setTimeout(() => setGracias((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [gracias]);

  const faltan = PREGUNTAS_OPINION.filter((p) => !valores[p.id]).length;

  async function enviar(e) {
    e.preventDefault();
    if (faltan) {
      setError(faltan === 1 ? "Falta una pregunta: toca una carita." : `Faltan ${faltan} preguntas: toca una carita en cada una.`);
      return;
    }
    setError("");
    setEnviando(true);
    const { quien, ...caritas } = valores;
    await enviarOpinion({ ...caritas, ...(quien ? { quien } : {}) });   // sin internet, espera en la cola
    setEnviando(false);
    sonido.bien?.();
    confeti({ colores: ESCALA_OPINION.map((c) => c.color), cantidad: 50 });
    setGracias(SEGUNDOS_GRACIAS);
  }

  if (gracias !== null) {
    return (
      <div className="pantalla opinion opinion--gracias">
        <div className="opinion__tarjeta" role="status">
          <div className="opinion__caras" aria-hidden="true">
            <img src={PERSONAJES.sismo.cara} alt="" width="72" height="72" />
            <img src={PERSONAJES.green.cara} alt="" width="72" height="72" />
          </div>
          <h1>¡Gracias por tu opinión!</h1>
          <p>Nos ayuda a mejorar el juego.</p>
          <p className="opinion__siguiente">La siguiente persona puede contestar en {gracias} s</p>
          <button type="button" className="boton-grande" onClick={() => setGracias(0)}>Otra opinión</button>
          {!completa.activa && <a className="opinion__volver" href="/">Ir al juego</a>}
        </div>
      </div>
    );
  }

  return (
    <div className="pantalla opinion">
      <form className="opinion__tarjeta" onSubmit={enviar} noValidate>
        <header className="opinion__cabeza">
          <div className="opinion__caras" aria-hidden="true">
            <img src={PERSONAJES.sismo.cara} alt="" width="64" height="64" />
            <img src={PERSONAJES.green.cara} alt="" width="64" height="64" />
          </div>
          <h1 ref={titulo} tabIndex={-1}>¿Qué te pareció?</h1>
          <p>Toca una carita en cada pregunta. <strong>No necesitas registrarte</strong> y nadie sabe quién contestó.</p>
          <span className="opinion__botones">
            <Escuchar etiqueta="Escuchar" texto={LEER} />
            <BotonCompleta completa={completa} />
          </span>
        </header>

        {PREGUNTAS_OPINION.map((p, i) => (
          <Caritas
            key={p.id}
            nombre={`op-${p.id}`}
            titulo={<><span className="opinion__numero" aria-hidden="true">{i + 1}</span> {p.texto}</>}
            valor={valores[p.id]}
            escala={ESCALA_OPINION}
            className="caritas--grandes"
            onCambiar={(v) => {
              sonido.clic?.();
              setError("");
              setValores((a) => ({ ...a, [p.id]: v }));
            }}
          />
        ))}

        <fieldset className="opinion__quien">
          <legend>Yo soy… <small>(si quieres)</small></legend>
          <div className="opinion__quien-fila">
            {QUIENES.map((q) => (
              <label key={q.id} className={valores.quien === q.id ? "elegido" : undefined}>
                <input
                  type="radio" name="op-quien" value={q.id} checked={valores.quien === q.id}
                  onChange={() => { sonido.clic?.(); setValores((a) => ({ ...a, quien: q.id })); }}
                />
                {q.texto}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="cuenta__error" role="alert">{error}</p>}
        <button className="boton-grande opinion__enviar" type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar mi opinión"}
        </button>
        {!completa.activa && <a className="opinion__volver" href="/">Ir al juego</a>}
      </form>
    </div>
  );
}
