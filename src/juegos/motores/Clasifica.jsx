import { useState, useMemo, useRef } from "react";
import { CLASIFICACIONES } from "../../data/juegos/clasificacion.js";
import { segundos, cuantasRondas } from "../../lib/dificultad.js";
import { construirResultado, puntosAcierto } from "../../lib/recompensas.js";
import { useCronometro, useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Progreso, Retroalimentacion, Aviso } from "../ui/Marco.jsx";

const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

/**
 * Motor de clasificar objetos en contenedores.
 *
 * Funciona de dos maneras a la vez, a propósito:
 *   - arrastrando el objeto hasta el contenedor (ratón y dedo)
 *   - tocando directamente el contenedor (lo más cómodo en celular
 *     y lo único que funciona con teclado o lector de pantalla)
 *
 * Lo usan "Clasifica la basura" y "Mochila de emergencia".
 */
export default function Clasifica({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = CLASIFICACIONES[juego.clasificacion];
  const enTiempo = useTemporizadores();

  const contenedores = datos?.contenedores || [];
  const total = Math.min(
    datos?.objetos.length || 0,
    cuantasRondas(dif, juego.rondas || 10, 5)
  );
  const segundosPieza = segundos(dif, juego.segundos || 7, 2.5);

  const cola = useMemo(
    () => revolver(datos?.objetos || []).slice(0, total),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [indice, setIndice] = useState(0);
  const [vidas, setVidas] = useState(dif.vidas);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [retro, setRetro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [delta, setDelta] = useState(null);
  const [resaltado, setResaltado] = useState(null);

  const puntosRef = useRef(0);
  const vidasRef = useRef(dif.vidas);
  const aciertosRef = useRef(0);
  const rachaRef = useRef(0);
  const bloqueado = useRef(false);
  const cerrado = useRef(false);
  const arrastre = useRef({ activo: false, x0: 0, y0: 0, movido: false });

  const actual = cola[indice];
  const jugando = !retro && !!actual && !cerrado.current;

  const tiempo = useCronometro({
    activo: jugando,
    segundos: segundosPieza,
    reinicio: indice,
    alTerminar: () => resolver(null),
  });

  function cerrar(completado) {
    if (cerrado.current) return;
    cerrado.current = true;
    onTerminar(
      construirResultado({
        puntos: puntosRef.current,
        aciertos: aciertosRef.current,
        total: cola.length,
        dificultad: dif.id,
        vidasIniciales: dif.vidas,
        vidasRestantes: vidasRef.current,
        completado,
        familia: juego.familia,
        resumen: `Clasificó bien ${aciertosRef.current} de ${cola.length}.`,
      })
    );
  }

  function mostrarAviso(texto, tipo) {
    setAviso({ texto, tipo });
    enTiempo(() => setAviso(null), 800);
  }

  function avanzar() {
    bloqueado.current = false;
    if (vidasRef.current <= 0) {
      cerrar(false);
      return;
    }
    if (indice + 1 >= cola.length) {
      cerrar(true);
      return;
    }
    setIndice((i) => i + 1);
  }

  function resolver(contenedorId) {
    if (bloqueado.current || !actual) return;
    bloqueado.current = true;
    setDelta(null);
    setResaltado(null);

    const correcto = contenedorId === actual.contenedor;

    if (correcto) {
      rachaRef.current += 1;
      aciertosRef.current += 1;
      setRacha(rachaRef.current);
      const ganados = puntosAcierto({
        base: 15,
        tiempo,
        factorTiempo: 3,
        racha: rachaRef.current - 1,
      });
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);
      sonido.moneda();
      if (rachaRef.current >= 3) {
        sonido.combo(rachaRef.current);
        confeti({ colores: personaje?.colores, cantidad: 28 });
      }
      mostrarAviso(rachaRef.current >= 3 ? `¡Racha x${rachaRef.current}! +${ganados}` : `+${ganados}`, "bien");
      enTiempo(avanzar, 620);
      return;
    }

    // error: aquí sí se explica, que es donde se aprende
    rachaRef.current = 0;
    setRacha(0);
    vidasRef.current -= 1;
    setVidas(vidasRef.current);
    sonido.mal();

    const bueno = contenedores.find((c) => c.id === actual.contenedor);
    setRetro({
      respuestaCorrecta: `${bueno?.icono || ""} ${bueno?.nombre || ""}`.trim(),
      explicacion: `${actual.nombre}. ${actual.explicacion || ""}`.trim(),
      dato: actual.dato,
      sinTiempo: !contenedorId,
    });
  }

  /* ------------------------- arrastrar y soltar ------------------------- */

  function boteBajo(x, y) {
    const el = document.elementFromPoint(x, y);
    return el?.closest?.("[data-bote]")?.dataset.bote || null;
  }

  function alBajar(e) {
    if (bloqueado.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    arrastre.current = { activo: true, x0: e.clientX, y0: e.clientY, movido: false };
  }

  function alMover(e) {
    if (!arrastre.current.activo) return;
    const dx = e.clientX - arrastre.current.x0;
    const dy = e.clientY - arrastre.current.y0;
    if (Math.abs(dx) + Math.abs(dy) > 8) arrastre.current.movido = true;
    setDelta({ dx, dy });
    if (arrastre.current.movido) setResaltado(boteBajo(e.clientX, e.clientY));
  }

  function alSoltar(e) {
    if (!arrastre.current.activo) return;
    const movido = arrastre.current.movido;
    arrastre.current.activo = false;
    setDelta(null);
    setResaltado(null);
    if (!movido) return; // fue un toque: que elija contenedor con los botones
    const bote = boteBajo(e.clientX, e.clientY);
    if (bote) resolver(bote);
  }

  if (!actual || !datos) return null;

  return (
    <div className="mini mini--clasifica">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        vidas={vidas}
        vidasMax={dif.vidas}
        puntos={puntos}
        onSalir={onSalir}
        extra={racha >= 2 ? <strong className="racha">🔥 x{racha}</strong> : null}
      />

      <Cronometro tiempo={jugando ? tiempo : 0} total={segundosPieza} />
      <Progreso hechos={indice} total={cola.length} texto={`${indice + 1} / ${cola.length}`} />

      {retro ? (
        <div className="clasifica__retro">
          {retro.sinTiempo && <p className="quiz__aviso">⏱️ Se acabó el tiempo</p>}
          <Retroalimentacion
            correcto={false}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={retro.explicacion}
            dato={retro.dato}
          />
          <div className="opciones">
            <button
              className="boton-grande"
              autoFocus
              onClick={() => {
                sonido.clic();
                setRetro(null);
                avanzar();
              }}
            >
              {vidasRef.current <= 0 ? "Ver resultado" : "Siguiente →"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="clasifica__pista">{datos.pista} Arrástralo o toca el contenedor.</p>

          <div className="clasifica__zona">
            <div
              className={`residuo residuo--arrastrable ${delta ? "residuo--tomado" : ""}`}
              style={delta ? { transform: `translate(${delta.dx}px, ${delta.dy}px)` } : undefined}
              onPointerDown={alBajar}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
            >
              <span className="residuo__icono" aria-hidden="true">
                {actual.icono}
              </span>
              <span className="residuo__nombre">{actual.nombre}</span>
            </div>
          </div>

          <div className={`botes botes--${contenedores.length > 3 ? "muchos" : "pocos"}`}>
            {contenedores.map((c) => (
              <button
                key={c.id}
                data-bote={c.id}
                className={`bote bote--boton ${resaltado === c.id ? "bote--resaltado" : ""}`}
                style={{ borderColor: c.color }}
                onClick={() => resolver(c.id)}
                aria-label={`Mandar ${actual.nombre} a ${c.nombre}`}
              >
                <span className="bote__icono" aria-hidden="true">
                  {c.icono}
                </span>
                <span>{c.nombre}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <Aviso aviso={aviso} />
    </div>
  );
}
