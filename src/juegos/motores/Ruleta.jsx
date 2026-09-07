import { useState, useRef } from "react";
import { RULETA } from "../../data/juegos/retos.js";
import { PREGUNTAS, comoOpciones } from "../../data/juegos/preguntas.js";
import { segundos, cuantasRondas } from "../../lib/dificultad.js";
import { construirResultado, puntosAcierto } from "../../lib/recompensas.js";
import { useCronometro, useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Progreso, Retroalimentacion } from "../ui/Marco.jsx";

const azar = (n) => Math.floor(Math.random() * n);
const revolver = (l) => [...l].sort(() => Math.random() - 0.5);

/**
 * Ruleta educativa.
 *
 * Cada gajo apunta a un banco de preguntas que ya existe en el proyecto,
 * así que la ruleta no necesita contenido propio: mezcla el que ya hay.
 * Gira, cae en una categoría y ahí viene la pregunta.
 */
export default function Ruleta({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = RULETA[juego.ruleta];
  const enTiempo = useTemporizadores();

  const gajos = datos?.gajos || [];
  const rondas = cuantasRondas(dif, juego.rondas || 6, 4, 12);
  const segundosPregunta = segundos(dif, juego.segundos || 18, 6);

  const [ronda, setRonda] = useState(0);
  const [fase, setFase] = useState("ruleta"); // ruleta | girando | pregunta | retro
  const [giro, setGiro] = useState(0);
  const [gajo, setGajo] = useState(null);
  const [pregunta, setPregunta] = useState(null);
  const [retro, setRetro] = useState(null);
  const [vidas, setVidas] = useState(dif.vidas);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);

  const puntosRef = useRef(0);
  const vidasRef = useRef(dif.vidas);
  const aciertosRef = useRef(0);
  const rachaRef = useRef(0);
  const vistasRef = useRef([]);
  const cerrado = useRef(false);

  const tiempo = useCronometro({
    activo: fase === "pregunta",
    segundos: segundosPregunta,
    reinicio: ronda,
    alTerminar: () => responder(null),
  });

  function cerrar(completado) {
    if (cerrado.current) return;
    cerrado.current = true;
    onTerminar(
      construirResultado({
        puntos: puntosRef.current,
        aciertos: aciertosRef.current,
        total: rondas,
        dificultad: dif.id,
        vidasIniciales: dif.vidas,
        vidasRestantes: vidasRef.current,
        completado,
        familia: juego.familia,
      })
    );
  }

  function girar() {
    if (fase !== "ruleta") return;
    sonido.clic();
    const elegido = azar(gajos.length);
    const vueltas = 3 + azar(3);
    setGiro((g) => g + vueltas * 360 + (360 - (elegido * 360) / gajos.length));
    setFase("girando");

    enTiempo(() => {
      const g = gajos[elegido];
      setGajo(g);
      sonido.combo(3);

      const banco = (PREGUNTAS[g.banco] || []).filter((p) => !vistasRef.current.includes(p.id));
      const fuente = banco.length ? banco : PREGUNTAS[g.banco] || [];
      const cruda = fuente[azar(fuente.length)];
      if (!cruda) {
        setFase("ruleta");
        return;
      }
      vistasRef.current.push(cruda.id);

      const preg = comoOpciones(cruda);
      const opciones = preg.fijas
        ? preg.opciones
        : (() => {
            const buenas = preg.opciones.filter((o) => o.ok);
            const malas = revolver(preg.opciones.filter((o) => !o.ok));
            const cupo = Math.max(2, Math.min(preg.opciones.length, dif.opciones));
            return revolver([...buenas, ...malas.slice(0, Math.max(1, cupo - buenas.length))]);
          })();

      setPregunta({ ...preg, opciones });
      setFase("pregunta");
    }, 1400);
  }

  function responder(opcion) {
    if (fase !== "pregunta") return;
    const correcto = !!opcion?.ok;
    let ganados = 0;

    if (correcto) {
      rachaRef.current += 1;
      aciertosRef.current += 1;
      setRacha(rachaRef.current);
      ganados = puntosAcierto({ base: 25, tiempo, factorTiempo: 2, racha: rachaRef.current - 1 });
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);
      sonido.bien();
      if (rachaRef.current >= 3) confeti({ colores: personaje?.colores, cantidad: 40 });
    } else {
      rachaRef.current = 0;
      setRacha(0);
      vidasRef.current -= 1;
      setVidas(vidasRef.current);
      sonido.mal();
    }

    setRetro({
      correcto,
      ganados,
      sinTiempo: !opcion,
      respuestaCorrecta: pregunta.opciones.find((o) => o.ok)?.texto,
      explicacion: pregunta.explicacion,
      dato: pregunta.dato,
    });
    setFase("retro");
  }

  function continuar() {
    sonido.clic();
    setRetro(null);
    setPregunta(null);
    setGajo(null);

    if (vidasRef.current <= 0) {
      cerrar(false);
      return;
    }
    if (ronda + 1 >= rondas) {
      cerrar(true);
      return;
    }
    setRonda((r) => r + 1);
    setFase("ruleta");
  }

  if (!datos) return null;

  const tajada = 360 / gajos.length;

  return (
    <div className="mini mini--ruleta">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        vidas={vidas}
        vidasMax={dif.vidas}
        puntos={puntos}
        onSalir={onSalir}
        extra={racha >= 2 ? <strong className="racha">🔥 x{racha}</strong> : null}
      />

      <Cronometro tiempo={fase === "pregunta" ? tiempo : 0} total={segundosPregunta} />
      <Progreso hechos={ronda} total={rondas} texto={`Giro ${ronda + 1} de ${rondas}`} />

      {(fase === "ruleta" || fase === "girando") && (
        <div className="ruleta">
          <span className="ruleta__aguja" aria-hidden="true">
            ▼
          </span>
          <div
            className="ruleta__disco"
            style={{
              transform: `rotate(${giro}deg)`,
              background: `conic-gradient(${gajos
                .map((g, i) => `${g.color} ${i * tajada}deg ${(i + 1) * tajada}deg`)
                .join(", ")})`,
            }}
            role="img"
            aria-label={`Ruleta con ${gajos.length} categorías`}
          >
            {gajos.map((g, i) => (
              <span
                key={g.banco}
                className="ruleta__gajo"
                style={{ transform: `rotate(${i * tajada + tajada / 2}deg)` }}
                aria-hidden="true"
              >
                {g.icono}
              </span>
            ))}
          </div>
        </div>
      )}

      {fase === "ruleta" && (
        <div className="opciones">
          <button className="boton-grande" onClick={girar}>
            🎲 Girar la ruleta
          </button>
        </div>
      )}

      {fase === "girando" && <p className="quiz__situacion ruleta__estado">Girando…</p>}

      {gajo && (fase === "pregunta" || fase === "retro") && (
        <p className="ruleta__categoria" style={{ background: gajo.color }}>
          {gajo.icono} {gajo.nombre}
        </p>
      )}

      {fase === "pregunta" && pregunta && (
        <>
          <div className="quiz__escena">
            <span className="quiz__icono" aria-hidden="true">
              {pregunta.icono || juego.icono}
            </span>
            <p className="quiz__situacion">{pregunta.situacion}</p>
          </div>
          <div className={`opciones ${pregunta.fijas ? "opciones--vf" : ""}`}>
            {pregunta.opciones.map((o, i) => (
              <button
                key={o.texto}
                onClick={() => responder(o)}
                className={pregunta.fijas ? "opcion-vf" : ""}
              >
                {!pregunta.fijas && (
                  <span className="opciones__letra" aria-hidden="true">
                    {["A", "B", "C", "D"][i]}
                  </span>
                )}
                {o.texto}
              </button>
            ))}
          </div>
        </>
      )}

      {fase === "retro" && retro && (
        <div className="quiz__retro">
          {retro.sinTiempo && <p className="quiz__aviso">⏱️ Se acabó el tiempo</p>}
          <Retroalimentacion
            correcto={retro.correcto}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={retro.explicacion}
            dato={retro.dato}
            ganados={retro.ganados}
          />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={continuar}>
              {vidasRef.current <= 0
                ? "Ver resultado"
                : ronda + 1 >= rondas
                  ? "Terminar →"
                  : "Otro giro 🎲"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
