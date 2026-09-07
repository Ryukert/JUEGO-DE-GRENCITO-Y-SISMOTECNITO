import { useState, useRef } from "react";
import { CULTIVOS, ETAPAS } from "../../data/juegos/cultivo.js";
import { construirResultado } from "../../lib/recompensas.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Progreso, Retroalimentacion } from "../ui/Marco.jsx";

const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

/**
 * Motor de decisiones con consecuencia visible.
 *
 * Cada elección suma o resta salud, y el árbol cambia de etapa en pantalla.
 * No hay cronómetro a propósito: aquí la idea es que el jugador piense.
 * La dificultad quita las pistas fáciles y exige más aciertos para el
 * mejor final.
 */
export default function Cultiva({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = CULTIVOS[juego.cultivo];

  const [indice, setIndice] = useState(0);
  const [salud, setSalud] = useState(3);
  const [puntos, setPuntos] = useState(0);
  const [retro, setRetro] = useState(null);

  const puntosRef = useRef(0);
  const saludRef = useRef(3);
  const aciertosRef = useRef(0);
  const cerrado = useRef(false);
  const [barajadas] = useState(() =>
    (datos?.pasos || []).map((p) => ({ ...p, opciones: revolver(p.opciones) }))
  );

  const paso = barajadas[indice];
  const etapa = Math.max(0, Math.min(ETAPAS.length - 1, Math.round(salud)));

  function cerrar() {
    if (cerrado.current) return;
    cerrado.current = true;
    const total = barajadas.length;
    const completado = saludRef.current >= 3;
    if (completado) confeti({ colores: personaje?.colores, cantidad: 100 });
    onTerminar(
      construirResultado({
        puntos: puntosRef.current,
        aciertos: aciertosRef.current,
        total,
        dificultad: dif.id,
        vidasIniciales: 3,
        vidasRestantes: Math.max(0, Math.min(3, Math.round(saludRef.current))),
        completado,
        familia: juego.familia,
        resumen: final(),
      })
    );
  }

  function final() {
    const s = saludRef.current;
    if (s >= 5) return datos.finales.excelente;
    if (s >= 3) return datos.finales.regular;
    return datos.finales.malo;
  }

  function elegir(opcion) {
    if (retro) return;
    const bueno = opcion.efecto > 0;

    saludRef.current = Math.max(0, Math.min(ETAPAS.length - 1, saludRef.current + opcion.efecto));
    setSalud(saludRef.current);

    if (bueno) {
      aciertosRef.current += 1;
      const ganados = 40 * opcion.efecto;
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);
      sonido.bien();
    } else {
      sonido.mal();
    }

    const mejor = paso.opciones.reduce((a, b) => (b.efecto > a.efecto ? b : a));

    setRetro({
      correcto: bueno,
      ganados: bueno ? 40 * opcion.efecto : 0,
      respuestaCorrecta: bueno ? null : mejor.texto,
      explicacion: opcion.explicacion,
      dato: opcion.dato,
    });
  }

  function continuar() {
    sonido.clic();
    setRetro(null);
    if (indice + 1 >= barajadas.length) {
      cerrar();
      return;
    }
    setIndice((i) => i + 1);
  }

  if (!datos || !paso) return null;

  return (
    <div className="mini mini--cultiva">
      <MarcoJuego juego={juego} dificultad={dif} puntos={puntos} onSalir={onSalir} />

      <Progreso
        hechos={indice}
        total={barajadas.length}
        texto={`Decisión ${indice + 1} de ${barajadas.length}`}
      />

      <div className="cultivo">
        <div className="cultivo__cielo">
          <span className="cultivo__planta" aria-label={`Etapa de crecimiento ${etapa} de 5`}>
            {ETAPAS[etapa]}
          </span>
        </div>
        <div className="cultivo__tierra">
          <span className="cultivo__salud" aria-label={`Salud ${etapa} de 5`}>
            {"🟩".repeat(etapa)}
            {"⬜".repeat(Math.max(0, 5 - etapa))}
          </span>
          <span className="cultivo__lugar">{datos.escenario}</span>
        </div>
      </div>

      {retro ? (
        <div className="quiz__retro">
          <Retroalimentacion
            correcto={retro.correcto}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={retro.explicacion}
            dato={retro.dato}
            ganados={retro.ganados}
          />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={continuar}>
              {indice + 1 >= barajadas.length ? "Ver cómo quedó →" : "Siguiente decisión →"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="quiz__situacion cultivo__pregunta">{paso.pregunta}</p>
          <div className="opciones">
            {paso.opciones.map((o) => (
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
