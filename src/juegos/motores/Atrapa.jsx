import { useState, useMemo, useEffect, useRef } from "react";
import { PREGUNTAS, comoOpciones } from "../../data/juegos/preguntas.js";
import { segundos, cuantasRondas } from "../../lib/dificultad.js";
import { construirResultado, puntosAcierto } from "../../lib/recompensas.js";
import { useCronometro, useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Progreso, Retroalimentacion } from "../ui/Marco.jsx";

const revolver = (l) => [...l].sort(() => Math.random() - 0.5);

/**
 * Atrapa la respuesta.
 *
 * Es un quiz, pero las respuestas no se están quietas: flotan por la
 * zona de juego y cambian de lugar cada cierto tiempo. Hay que leer y
 * atrapar la buena antes de que se acabe el reloj.
 *
 * La dificultad cambia cada cuánto se mueven y cuánto tiempo hay, no las
 * preguntas. El intervalo se limpia al desmontar.
 */
export default function Atrapa({ juego, personaje, dif, onTerminar, onSalir }) {
  const enTiempo = useTemporizadores();

  const bancos = juego.bancos || [juego.banco];
  const fuente = useMemo(
    () => bancos.flatMap((b) => PREGUNTAS[b] || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const total = Math.min(fuente.length, cuantasRondas(dif, juego.rondas || 8, 4, 14));
  const segundosPregunta = segundos(dif, juego.segundos || 15, 5);
  const intervaloMovimiento = Math.round(1500 * dif.ritmo);

  const tanda = useMemo(() => {
    return revolver(fuente)
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
  const [posiciones, setPosiciones] = useState([]);

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

  /* Las respuestas se reacomodan solas. El intervalo se limpia al salir
     del juego y al pasar de pregunta: nada queda corriendo detrás. */
  useEffect(() => {
    if (!jugando) return undefined;
    const cuantas = pregunta.opciones.length;
    const acomodar = () =>
      setPosiciones(
        Array.from({ length: cuantas }, (_, i) => ({
          x: 6 + Math.random() * 52,
          y: (i * 100) / cuantas + Math.random() * (60 / cuantas),
        }))
      );
    acomodar();
    const id = setInterval(acomodar, intervaloMovimiento);
    return () => clearInterval(id);
  }, [indice, jugando, intervaloMovimiento, pregunta]);

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
    let ganados = 0;

    if (correcto) {
      rachaRef.current += 1;
      aciertosRef.current += 1;
      setRacha(rachaRef.current);
      ganados = puntosAcierto({ base: 25, tiempo, factorTiempo: 3, racha: rachaRef.current - 1 });
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);
      sonido.moneda();
      if (rachaRef.current >= 3) {
        sonido.combo(rachaRef.current);
        confeti({ colores: personaje?.colores, cantidad: 35 });
      }
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
  }

  function continuar() {
    sonido.clic();
    setRetro(null);
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
    <div className="mini mini--atrapa">
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
          {retro.sinTiempo && <p className="quiz__aviso">⏱️ Se te escaparon</p>}
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
                : indice + 1 >= tanda.length
                  ? "Terminar →"
                  : "Siguiente →"}
            </button>
          </div>
        </div>
      ) : (
        <div className="cancha" aria-label="Atrapa la respuesta correcta">
          {pregunta.opciones.map((o, i) => (
            <button
              key={o.texto}
              className="cancha__opcion"
              style={{
                left: `${posiciones[i]?.x ?? 10}%`,
                top: `${posiciones[i]?.y ?? i * 25}%`,
                transitionDuration: `${Math.max(400, intervaloMovimiento - 300)}ms`,
              }}
              onClick={() => responder(o)}
            >
              {o.texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
