import { useState, useEffect, useRef } from "react";
import { GRADOS } from "../data/personajes.js";
import { sonido } from "../lib/sonido.js";
import { confeti } from "../lib/confeti.js";
import { revolver } from "../lib/azar.js";
import Icono from "./Icono.jsx";
import Reloj from "./Reloj.jsx";
import { anotarRespuesta } from "../lib/cuenta.js";
import { Escuchar } from "../juegos/ui/Marco.jsx";

export default function Reto({
  personaje: p,
  grado,
  mision,
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
  // cómo reacciona el personaje en escena: piensa (esperando), feliz, triste o tiempo
  const [animo, setAnimo] = useState("piensa");
  const reloj = useRef(null);
  const finRef = useRef(null);
  const seguirRef = useRef(null);
  const contestado = useRef(false);

  const enBono = etapa === "bono";
  const pregunta = enBono ? mision.retoSecundaria : mision;

  // En los datos la respuesta buena va primero; sin revolver siempre sería la A.
  const [principales] = useState(() =>
    revolver(cfg.opcionExtra && mision.opcionExtra ? [...mision.opciones, mision.opcionExtra] : mision.opciones)
  );
  const [delBono] = useState(() => revolver(mision.retoSecundaria?.opciones || []));
  const opciones = enBono ? delBono : principales;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, etapa]);

  // al responder, el foco pasa a «Siguiente»: con teclado basta Enter para seguir
  useEffect(() => {
    if (etapa === "resultado" || etapa === "bonoResultado") seguirRef.current?.focus({ preventScroll: true });
  }, [etapa]);

  useEffect(() => {
    if (etapa !== "pregunta" && etapa !== "bono") return;
    setAnimo("piensa");
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

  function responder(opcion) {
    if (contestado.current) return;
    contestado.current = true;
    clearInterval(reloj.current);

    const correcto = !!opcion?.ok;
    setAnimo(correcto ? "feliz" : opcion ? "triste" : "tiempo");
    const elegido = opcion ? opcion.texto : "Se acabó el tiempo";
    const doble = enBono ? 2 : 1;

    let ganados = 0;
    let multiplicador = 1;
    if (correcto) {
      multiplicador = racha >= 4 ? 3 : racha >= 2 ? 2 : 1;
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
        multi: multiplicador,
      },
    ]);

    if (correcto) onPuntos(ganados);
    else onFallo();

    // para el panel del maestro (solo si el alumno entró a un grupo; el servidor califica)
    anotarRespuesta({ personaje: p.id, grado, mision: mision.id, bono: enBono, eleccion: opcion ? opcion.texto : null });

    setEtapa(enBono ? "bonoResultado" : "resultado");
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

  return (
    <>
      {enPregunta && <Reloj tiempo={tiempo} total={cfg.segundos} />}

      <div className="mision-escena">
        {/* el personaje en grande, detrás de la conversación; reacciona a cada respuesta */}
        <div className={`mision-escena__personaje mision-escena__personaje--${animo}`} aria-hidden="true">
          <img src={p.cuerpo} alt="" />
          {animo === "feliz" && <span className="mision-escena__globo">¡Bien!</span>}
          {animo === "triste" && <span className="mision-escena__globo">¡Casi!</span>}
          {animo === "tiempo" && <span className="mision-escena__globo"><Icono nombre="reloj" /></span>}
        </div>
        {mision.lugar && <span className="mision-escena__lugar"><Icono nombre="lugar" /> {mision.lugar}</span>}

      <div className="conversacion" role="log" aria-live="polite">
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
                    <Icono nombre={m.correcto ? "bien" : "mal"} /> {m.veredicto}
                    {m.ganados > 0 && <b> +{m.ganados}</b>}
                    {m.multi > 1 && (
                      <span className="veredicto__racha">
                        <Icono nombre="fuego" /> racha x{m.multi}
                      </span>
                    )}
                  </span>
                )}
                <p>{m.texto}</p>
              </div>
            </div>
          )
        )}

        {/* espacio al final: la conversación no tapa la reacción del personaje */}
        <div className="mision-escena__espacio" aria-hidden="true" />
        <div ref={finRef} />
      </div>
      </div>

      <div className="pie">
        {enPregunta && (
          <Escuchar
            etiqueta="Escuchar la pregunta"
            texto={`${enBono ? mision.retoSecundaria.pregunta : mision.escenario}. Las respuestas son: ${opciones
              .map((o, i) => `${["A", "B", "C", "D"][i]}: ${o.texto}`)
              .join(". ")}.`}
          />
        )}
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
            <button className="boton-grande" onClick={continuar} ref={seguirRef}>
              {etapa === "resultado" && hayBono ? (
                <>Pregunta de bonificación <Icono nombre="estrella" /></>
              ) : (
                <>Siguiente misión <Icono nombre="siguiente" /></>
              )}
            </button>
          </div>
        )}

      </div>
    </>
  );
}
