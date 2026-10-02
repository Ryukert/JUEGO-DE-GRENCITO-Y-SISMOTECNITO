import { useState, useRef, useEffect } from "react";
import { CONSTRUCCIONES } from "../../data/juegos/construcciones.js";
import { construirResultado } from "../../lib/recompensas.js";
import { useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { revolver } from "../../lib/azar.js";
import { leerSiHaySonido, callar } from "../../lib/voz.js";
import { MarcoJuego, Progreso, Retroalimentacion, Escuchar } from "../ui/Marco.jsx";
import Edificio from "../ui/Edificio.jsx";

/** La mejor opción siempre está; el resto se elige al azar y todo se revuelve. */
function opcionesDeEtapa(opciones, cuantas) {
  const mejor = opciones.reduce((a, b) => (b.solidez > a.solidez ? b : a));
  const otras = revolver(opciones.filter((o) => o !== mejor)).slice(0, cuantas - 1);
  return revolver([mejor, ...otras]);
}

/**
 * Motor de armar algo por etapas y luego probarlo.
 *
 * Lo usan "Construye un edificio" (que al final se somete a un sismo) y
 * "Captura de lluvia" (que al final aguanta una temporada de lluvias).
 * El edificio se dibuja pieza por pieza (ui/Edificio.jsx); lo demás se
 * apila como lista. Al final se ve la prueba y cómo quedó lo construido.
 *
 * En fácil (primaria) se lee poco: textos cortos, dos opciones grandes,
 * sin el "¿sabías que...?" y con lectura en voz alta. En difícil no se
 * avisa si la pieza fue buena hasta la prueba final, que es lo realista.
 */
export default function Construye({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = CONSTRUCCIONES[juego.construccion];
  const enTiempo = useTemporizadores();

  const avisaAlMomento = dif.id !== "dificil";
  const lectura = dif.id === "facil";
  const dibuja = datos?.dibujo === "edificio";

  // en fácil el texto corto, si lo hay; en los demás, el completo
  const decir = (obj, largo, corto) => (lectura && obj?.[corto]) || obj?.[largo];

  const [etapas] = useState(() =>
    (datos?.etapas || []).map((e) => ({
      ...e,
      opciones: opcionesDeEtapa(e.opciones, lectura ? 2 : e.opciones.length),
    }))
  );
  const [indice, setIndice] = useState(0);
  const [pila, setPila] = useState([]);
  const [retro, setRetro] = useState(null);
  const [fase, setFase] = useState("construyendo"); // construyendo | prueba | final
  const [nivel, setNivel] = useState(null); // excelente | regular | malo

  const solidezRef = useRef(0);
  const aciertosRef = useRef(0);
  const cerrado = useRef(false);

  const etapa = etapas[indice];
  const pregunta = decir(etapa, "pregunta", "preguntaCorta");
  const textoOpciones = etapa
    ? `${pregunta} ${etapa.opciones.map((o, i) => `Opción ${i + 1}: ${decir(o, "texto", "corto")}.`).join(" ")}`
    : "";
  const textoFinal = nivel ? decir(datos, "resultados", "resultadosCortos")[nivel] : "";

  // primaria: el juego lee solo cada pregunta, su explicación y el final
  useEffect(() => {
    if (!lectura) return;
    if (fase === "final") leerSiHaySonido(textoFinal);
    else if (fase === "construyendo") leerSiHaySonido(retro ? retro.explicacion : textoOpciones);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, retro, fase]);

  useEffect(() => () => callar(), []);

  function calificar() {
    const s = solidezRef.current;
    if (s >= Math.ceil(etapas.length * 1.4)) return "excelente";
    if (s >= Math.ceil(etapas.length * 0.6)) return "regular";
    return "malo";
  }

  function cerrar() {
    if (cerrado.current) return;
    cerrado.current = true;
    callar();

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
        resumen: datos.resultados[calificar()],
      })
    );
  }

  function elegir(opcion) {
    if (retro) return;

    solidezRef.current += opcion.solidez;
    if (opcion.solidez > 0) aciertosRef.current += 1;
    setPila((p) => [...p, { ...opcion, etapa: etapa.nombre, etapaId: etapa.id }]);
    opcion.solidez > 0 ? sonido.bien() : sonido.mal();

    const mejor = etapa.opciones.reduce((a, b) => (b.solidez > a.solidez ? b : a));
    setRetro({
      correcto: opcion.solidez > 0,
      mostrarVeredicto: avisaAlMomento,
      explicacion: decir(opcion, "explicacion", "explicacionCorta"),
      dato: lectura ? null : opcion.dato,
      respuestaCorrecta: avisaAlMomento && opcion.solidez <= 0 ? decir(mejor, "texto", "corto") : null,
    });
  }

  function continuar() {
    sonido.clic();
    callar();
    setRetro(null);

    if (indice + 1 >= etapas.length) {
      // la prueba final: tiembla y luego se ve cómo quedó lo construido
      setFase("prueba");
      sonido.temblor();
      enTiempo(() => {
        const n = calificar();
        setNivel(n);
        setFase("final");
        if (n === "malo") sonido.mal();
        else sonido.victoria();
      }, 1800);
      return;
    }
    setIndice((i) => i + 1);
  }

  if (!datos || !etapa) return null;

  const piezas = Object.fromEntries(pila.map((p) => [p.etapaId, p]));
  const estadoDibujo = fase === "construyendo" ? "obra" : fase === "prueba" ? "sismo" : nivel;

  return (
    <div className={`mini mini--construye ${lectura ? "mini--lectura" : ""} ${fase === "prueba" ? "sacude" : ""}`}>
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        puntos={pila.length}
        onSalir={onSalir}
        extra={<span className="constr__etapa">{etapa.nombre}</span>}
      />

      <Progreso
        hechos={fase === "construyendo" ? indice : etapas.length}
        total={etapas.length}
        texto={fase === "construyendo" ? `Etapa ${indice + 1} de ${etapas.length}` : datos.prueba}
      />

      {dibuja ? (
        <Edificio
          piezas={piezas}
          siguiente={retro ? null : etapa.id}
          estado={estadoDibujo}
          revelar={avisaAlMomento}
        />
      ) : (
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
      )}

      {fase === "prueba" ? (
        <p className="constr__prueba" role="status">
          {datos.prueba}
        </p>
      ) : fase === "final" ? (
        <div className="quiz__retro">
          {!dibuja && (
            <p className="constr__prueba">
              {nivel === "excelente" ? "✅ ¡Funcionó!" : nivel === "regular" ? "⚠️ Funcionó a medias" : "💥 Falló"}
            </p>
          )}
          <p className="constr__final">{textoFinal}</p>
          <Escuchar texto={textoFinal} />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={cerrar}>
              Ver recompensa →
            </button>
          </div>
        </div>
      ) : retro ? (
        <div className="quiz__retro">
          <Retroalimentacion
            correcto={retro.mostrarVeredicto ? retro.correcto : true}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={retro.explicacion}
            dato={retro.dato}
          />
          <Escuchar texto={retro.explicacion} />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={continuar}>
              {indice + 1 >= etapas.length ? `${datos.prueba} →` : "Siguiente etapa →"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="constr__pregunta">
            <p className="quiz__situacion">{pregunta}</p>
            <Escuchar texto={textoOpciones} />
          </div>
          <div className={`opciones ${lectura ? "opciones--grandes" : ""}`}>
            {etapa.opciones.map((o) => (
              <button key={o.texto} onClick={() => elegir(o)}>
                <span className="opciones__letra" aria-hidden="true">
                  {o.icono}
                </span>
                {decir(o, "texto", "corto")}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
