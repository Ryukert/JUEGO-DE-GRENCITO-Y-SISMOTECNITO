import { useState, useMemo, useRef } from "react";
import { PREGUNTAS, comoOpciones } from "../../data/juegos/preguntas.js";
import { segundos, cuantasRondas } from "../../lib/dificultad.js";
import { construirResultado, puntosAcierto } from "../../lib/recompensas.js";
import { useCronometro } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Progreso, Retroalimentacion } from "../ui/Marco.jsx";

const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

/**
 * Motor de preguntas de decisión.
 *
 * Lo usan una docena de minijuegos distintos (incendio, extintor, fuga de
 * gas, ahorra agua, verdadero o falso...). Lo único que cambia entre uno y
 * otro es `juego.banco`, que apunta a un arreglo de src/data/juegos/preguntas.js
 *
 * La dificultad cambia el tiempo por pregunta, cuántas preguntas hay,
 * cuántas opciones se muestran y con cuántas vidas arrancas.
 */
export default function Quiz({ juego, personaje, dif, onTerminar, onSalir }) {
  const banco = PREGUNTAS[juego.banco] || [];

  const total = Math.min(banco.length, cuantasRondas(dif, juego.rondas || 8, 4));
  const segundosPregunta = segundos(dif, juego.segundos || 18, 5);

  // La tanda se arma una sola vez por partida.
  const tanda = useMemo(() => {
    return revolver(banco)
      .slice(0, total)
      .map((p) => {
        const preg = comoOpciones(p);
        if (preg.fijas) return preg;
        const buenas = preg.opciones.filter((o) => o.ok);
        const malas = revolver(preg.opciones.filter((o) => !o.ok));
        const cupo = Math.max(2, Math.min(preg.opciones.length, dif.opciones));
        return {
          ...preg,
          opciones: revolver([...buenas, ...malas.slice(0, Math.max(1, cupo - buenas.length))]),
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [indice, setIndice] = useState(0);
  const [vidas, setVidas] = useState(dif.vidas);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [retro, setRetro] = useState(null);
  const [elegida, setElegida] = useState(null);

  const puntosRef = useRef(0);
  const vidasRef = useRef(dif.vidas);
  const aciertosRef = useRef(0);
  const rachaRef = useRef(0);
  const cerrado = useRef(false);

  const pregunta = tanda[indice];
  const jugando = !retro && !!pregunta;

  const tiempo = useCronometro({
    activo: jugando,
    segundos: segundosPregunta,
    reinicio: indice,
    alTerminar: () => responder(null),
  });

  function cerrar(completado) {
    if (cerrado.current) return;
    cerrado.current = true;
    onTerminar(
      construirResultado({
        puntos: puntosRef.current,
        aciertos: aciertosRef.current,
        total: tanda.length,
        dificultad: dif.id,
        vidasIniciales: dif.vidas,
        vidasRestantes: vidasRef.current,
        completado,
        familia: juego.familia,
      })
    );
  }

  function responder(opcion) {
    if (retro || !pregunta) return;
    const correcto = !!opcion?.ok;
    setElegida(opcion?.texto ?? null);

    let ganados = 0;
    if (correcto) {
      rachaRef.current += 1;
      aciertosRef.current += 1;
      ganados = puntosAcierto({ base: 20, tiempo, factorTiempo: 2, racha: rachaRef.current - 1 });
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);
      setRacha(rachaRef.current);
      sonido.bien();
      if (rachaRef.current >= 3) {
        sonido.combo(rachaRef.current);
        confeti({ colores: personaje?.colores, cantidad: 40 });
      }
    } else {
      rachaRef.current = 0;
      setRacha(0);
      vidasRef.current -= 1;
      setVidas(vidasRef.current);
      sonido.mal();
    }

    const buena = pregunta.opciones.find((o) => o.ok);
    setRetro({
      correcto,
      ganados,
      respuestaCorrecta: buena?.texto,
      explicacion: pregunta.explicacion,
      dato: pregunta.dato,
      sinTiempo: !opcion,
    });
  }

  function continuar() {
    sonido.clic();
    setRetro(null);
    setElegida(null);

    // Se cierra en el acto: si se dejara un respiro, el jugador podría
    // volver a contestar la última pregunta antes de ver el resultado.
    if (vidasRef.current <= 0) {
      cerrar(false);
      return;
    }
    if (indice + 1 >= tanda.length) {
      cerrar(true);
      return;
    }
    setIndice((i) => i + 1);
  }

  if (!pregunta) return null;

  return (
    <div className={`mini mini--quiz ${juego.piel ? `mini--${juego.piel}` : ""}`}>
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        vidas={vidas}
        vidasMax={dif.vidas}
        puntos={puntos}
        onSalir={onSalir}
        extra={racha >= 2 ? <strong className="racha">🔥 x{racha}</strong> : null}
      />

      <Cronometro tiempo={jugando ? tiempo : 0} total={segundosPregunta} />
      <Progreso hechos={indice} total={tanda.length} texto={`${indice + 1} / ${tanda.length}`} />

      <div className="quiz__escena">
        <span className="quiz__icono" aria-hidden="true">
          {pregunta.icono || juego.icono}
        </span>
        <p className="quiz__situacion">{pregunta.situacion}</p>
      </div>

      {retro ? (
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
            <button className="boton-grande" onClick={continuar} autoFocus>
              {vidasRef.current <= 0
                ? "Ver resultado"
                : indice + 1 >= tanda.length
                  ? "Terminar →"
                  : "Siguiente →"}
            </button>
          </div>
        </div>
      ) : (
        <div className={`opciones ${pregunta.fijas ? "opciones--vf" : ""}`}>
          {pregunta.opciones.map((o, i) => (
            <button
              key={o.texto}
              onClick={() => responder(o)}
              disabled={!!elegida}
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
      )}
    </div>
  );
}
