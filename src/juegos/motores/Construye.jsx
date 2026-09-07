import { useState, useRef } from "react";
import { CONSTRUCCIONES } from "../../data/juegos/construcciones.js";
import { construirResultado } from "../../lib/recompensas.js";
import { useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Progreso, Retroalimentacion } from "../ui/Marco.jsx";

const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

/**
 * Motor de armar algo por etapas y luego probarlo.
 *
 * Lo usan "Construye un edificio" (que al final se somete a un sismo) y
 * "Captura de lluvia" (que al final aguanta una temporada de lluvias).
 * Cada elección se apila en pantalla, así que el jugador ve lo que
 * construyó antes de que llegue la prueba.
 */
export default function Construye({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = CONSTRUCCIONES[juego.construccion];
  const enTiempo = useTemporizadores();

  // En fácil se avisa qué tan buena fue la elección al momento; en difícil
  // el jugador se entera hasta la prueba final, que es lo realista.
  const avisaAlMomento = dif.id !== "dificil";

  const [etapas] = useState(() =>
    (datos?.etapas || []).map((e) => ({ ...e, opciones: revolver(e.opciones) }))
  );
  const [indice, setIndice] = useState(0);
  const [pila, setPila] = useState([]);
  const [retro, setRetro] = useState(null);
  const [temblando, setTemblando] = useState(false);

  const solidezRef = useRef(0);
  const aciertosRef = useRef(0);
  const cerrado = useRef(false);

  const etapa = etapas[indice];

  function cerrar() {
    if (cerrado.current) return;
    cerrado.current = true;

    const maximo = etapas.length * 2;
    const proporcion = (solidezRef.current + maximo) / (maximo * 2); // 0 a 1
    const completado = solidezRef.current >= Math.ceil(etapas.length * 0.6);

    if (completado) confeti({ colores: personaje?.colores, cantidad: 110 });

    onTerminar(
      construirResultado({
        puntos: Math.round(proporcion * 700),
        aciertos: aciertosRef.current,
        total: etapas.length,
        dificultad: dif.id,
        vidasIniciales: etapas.length,
        vidasRestantes: aciertosRef.current,
        completado,
        familia: juego.familia,
        resumen: veredicto(),
      })
    );
  }

  function veredicto() {
    const s = solidezRef.current;
    if (s >= Math.ceil(etapas.length * 1.4)) return datos.resultados.excelente;
    if (s >= Math.ceil(etapas.length * 0.6)) return datos.resultados.regular;
    return datos.resultados.malo;
  }

  function elegir(opcion) {
    if (retro) return;

    solidezRef.current += opcion.solidez;
    if (opcion.solidez > 0) aciertosRef.current += 1;
    setPila((p) => [...p, { ...opcion, etapa: etapa.nombre }]);
    opcion.solidez > 0 ? sonido.bien() : sonido.mal();

    setRetro({
      correcto: opcion.solidez > 0,
      mostrarVeredicto: avisaAlMomento,
      explicacion: opcion.explicacion,
      dato: opcion.dato,
      respuestaCorrecta:
        avisaAlMomento && opcion.solidez <= 0
          ? etapa.opciones.reduce((a, b) => (b.solidez > a.solidez ? b : a)).texto
          : null,
    });
  }

  function continuar() {
    sonido.clic();
    setRetro(null);

    if (indice + 1 >= etapas.length) {
      // la prueba final: se sacude la pantalla y se entrega el resultado
      setTemblando(true);
      sonido.temblor();
      enTiempo(() => {
        setTemblando(false);
        cerrar();
      }, 1600);
      return;
    }
    setIndice((i) => i + 1);
  }

  if (!datos || !etapa) return null;

  return (
    <div className={`mini mini--construye ${temblando ? "sacude" : ""}`}>
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        puntos={pila.length}
        onSalir={onSalir}
        extra={<span className="constr__etapa">{etapa.nombre}</span>}
      />

      <Progreso
        hechos={indice}
        total={etapas.length}
        texto={`Etapa ${indice + 1} de ${etapas.length}`}
      />

      <div className="obra" aria-label="Lo que llevas construido">
        {[...pila].reverse().map((pieza, i) => (
          <div
            key={`${pieza.etapa}-${i}`}
            className={`obra__pieza ${pieza.solidez > 0 ? "obra__pieza--firme" : "obra__pieza--floja"}`}
          >
            <span className="obra__icono" aria-hidden="true">
              {pieza.icono}
            </span>
            <span className="obra__nombre">{pieza.etapa}</span>
          </div>
        ))}
        <div className="obra__suelo">{datos.escenario}</div>
      </div>

      {temblando ? (
        <p className="constr__prueba" role="status">
          {datos.prueba}
        </p>
      ) : retro ? (
        <div className="quiz__retro">
          <Retroalimentacion
            correcto={retro.mostrarVeredicto ? retro.correcto : true}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={retro.explicacion}
            dato={retro.dato}
          />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={continuar}>
              {indice + 1 >= etapas.length ? `${datos.prueba} →` : "Siguiente etapa →"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="quiz__situacion">{etapa.pregunta}</p>
          <div className="opciones">
            {etapa.opciones.map((o) => (
              <button key={o.texto} onClick={() => elegir(o)}>
                <span className="opciones__letra" aria-hidden="true">
                  {o.icono}
                </span>
                {o.texto}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
