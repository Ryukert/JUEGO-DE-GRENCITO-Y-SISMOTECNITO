import { useState, useEffect, useRef } from "react";
import { GRADOS, construirSistema } from "../data/personajes.js";
import { sonido } from "../lib/sonido.js";
import { confeti } from "../lib/confeti.js";

export default function Reto({
  personaje: p,
  grado,
  mision,
  vidas,
  puntos,
  racha,
  onPuntos,
  onFallo,
  onFin,
}) {
  const cfg = GRADOS[grado];
  const hayBono = cfg.retoExtra && mision.retoSecundaria;

  const [etapa, setEtapa] = useState("pregunta"); // pregunta | resultado | bono | bonoResultado
  const [tiempo, setTiempo] = useState(cfg.segundos);
  const [mensajes, setMensajes] = useState([{ de: "bot", texto: mision.escenario }]);
  const [pensando, setPensando] = useState(false);
  const [texto, setTexto] = useState("");
  const [ultimo, setUltimo] = useState(null);
  const reloj = useRef(null);
  const finRef = useRef(null);
  const contestado = useRef(false);

  const enBono = etapa === "bono";
  const pregunta = enBono ? mision.retoSecundaria : mision;
  const opciones = enBono
    ? mision.retoSecundaria.opciones
    : cfg.opcionExtra && mision.opcionExtra
      ? [...mision.opciones, mision.opcionExtra]
      : mision.opciones;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, pensando, etapa]);

  useEffect(() => {
    if (etapa !== "pregunta" && etapa !== "bono") return;
    contestado.current = false;
    setTiempo(cfg.segundos);
    reloj.current = setInterval(() => {
      setTiempo((t) => Math.max(0, +(t - 0.1).toFixed(1)));
    }, 100);
    return () => clearInterval(reloj.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  useEffect(() => {
    if (etapa !== "pregunta" && etapa !== "bono") return;
    if (tiempo <= 0) responder(null);
    else if (tiempo <= 3 && Math.abs(tiempo % 1) < 0.05) sonido.tic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempo, etapa]);

  async function comentario(prompt, contexto) {
    setPensando(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: construirSistema(p, grado, contexto),
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!r.ok) throw new Error("sin servidor");
      const { texto: t } = await r.json();
      if (t) setMensajes((m) => [...m, { de: "bot", texto: t }]);
    } catch (e) {
      /* sin conexión: el juego ya mostró la explicación local */
    } finally {
      setPensando(false);
    }
  }

  function responder(opcion) {
    if (contestado.current) return;
    contestado.current = true;
    clearInterval(reloj.current);

    const correcto = !!opcion?.ok;
    const elegido = opcion ? opcion.texto : "Se acabó el tiempo";
    const doble = enBono ? 2 : 1;

    let ganados = 0;
    if (correcto) {
      const multiplicador = racha >= 4 ? 3 : racha >= 2 ? 2 : 1;
      ganados = Math.round((15 + tiempo) * multiplicador * doble);
      sonido.bien();
      confeti({ colores: p.colores, cantidad: multiplicador > 1 ? 70 : 45 });
    } else {
      sonido.mal();
    }

    setMensajes((m) => [
      ...m,
      { de: "yo", texto: elegido },
      {
        de: "bot",
        texto: pregunta.explicacion,
        veredicto: correcto ? "¡Correcto!" : opcion ? "Casi" : "Tiempo",
        correcto,
        ganados,
      },
    ]);

    setUltimo({ correcto, ganados });
    if (correcto) onPuntos(ganados);
    else onFallo();

    comentario(
      `El jugador respondió: "${elegido}". La respuesta ${correcto ? "es correcta" : "no es correcta"}. Comenta en una o dos frases, ${correcto ? "celebrando" : "corrigiendo con ánimo"}, y cierra con este dato si viene al caso: ${mision.dato || pregunta.explicacion}`,
      `Misión "${mision.titulo}". Pregunta: ${enBono ? pregunta.pregunta : mision.escenario}`
    );

    setEtapa(enBono ? "bonoResultado" : "resultado");
  }

  async function preguntarLibre(e) {
    e.preventDefault();
    const q = texto.trim();
    if (!q || pensando) return;
    setTexto("");
    setMensajes((m) => [...m, { de: "yo", texto: q }]);
    sonido.clic();
    await comentario(q, `Misión "${mision.titulo}": ${mision.escenario}`);
  }

  function continuar() {
    sonido.clic();
    if (etapa === "resultado" && hayBono) {
      setMensajes((m) => [
        ...m,
        { de: "sistema", texto: "Pregunta de bonificación: vale el doble" },
        { de: "bot", texto: mision.retoSecundaria.pregunta },
      ]);
      setEtapa("bono");
    } else {
      onFin();
    }
  }

  const enPregunta = etapa === "pregunta" || etapa === "bono";
  const porcentaje = (tiempo / cfg.segundos) * 100;

  return (
    <>
      {enPregunta && (
        <div className="cronometro" aria-label={`Quedan ${Math.ceil(tiempo)} segundos`}>
          <div
            className={`cronometro__barra ${porcentaje < 35 ? "cronometro__barra--peligro" : ""}`}
            style={{ width: `${porcentaje}%` }}
          />
          <span className="cronometro__numero">{Math.ceil(tiempo)}</span>
        </div>
      )}

      <div className="chat" role="log" aria-live="polite">
        {mensajes.map((m, i) =>
          m.de === "sistema" ? (
            <p className="separador" key={i}>{m.texto}</p>
          ) : (
            <div className={`fila ${m.de === "yo" ? "fila--mia" : ""}`} key={i}>
              {m.de === "bot" && <img className="cara" src={p.cara} alt="" width="44" height="44" />}
              <div
                className={`globo ${m.de === "yo" ? "globo--mio" : ""} ${
                  m.veredicto ? (m.correcto ? "globo--bien" : "globo--mal") : ""
                }`}
              >
                {m.veredicto && (
                  <span className={`veredicto ${m.correcto ? "veredicto--bien" : "veredicto--mal"}`}>
                    {m.correcto ? "✓" : "✕"} {m.veredicto}
                    {m.ganados > 0 && <b> +{m.ganados}</b>}
                  </span>
                )}
                <p>{m.texto}</p>
              </div>
            </div>
          )
        )}

        {pensando && (
          <div className="fila">
            <img className="cara" src={p.cara} alt="" width="44" height="44" />
            <div className="globo">
              <span className="puntitos"><i /><i /><i /></span>
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="pie">
        {enPregunta && (
          <div className="opciones">
            {opciones.map((o, i) => (
              <button key={i} onClick={() => responder(o)}>
                <span className="opciones__letra" aria-hidden="true">
                  {["A", "B", "C", "D"][i]}
                </span>
                {o.texto}
              </button>
            ))}
          </div>
        )}

        {!enPregunta && (
          <div className="opciones">
            <button className="boton-grande" onClick={continuar}>
              {etapa === "resultado" && hayBono ? "Pregunta de bonificación ⭐" : "Siguiente misión →"}
            </button>
          </div>
        )}

        <form className="escribe" onSubmit={preguntarLibre}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Pregúntale algo a ${p.nombre}...`}
            aria-label={`Escribe tu pregunta para ${p.nombre}`}
            disabled={pensando}
            enterKeyHint="send"
            autoComplete="off"
          />
          <button type="submit" className="enviar" disabled={pensando || !texto.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </>
  );
}
