import { useState, useMemo, useRef } from "react";
import { SIMULACIONES } from "../../data/juegos/simulaciones.js";
import { construirResultado } from "../../lib/recompensas.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Progreso, Retroalimentacion } from "../ui/Marco.jsx";

const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);
const acotar = (n) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Motor de los retos avanzados: ciudad sostenible, salva el planeta,
 * ecosistema, comandante de emergencias, simulador de emergencia y el
 * gran desafío Tecnito vs Greencito.
 *
 * Todos funcionan igual: hay indicadores de 0 a 100 con una meta, y en
 * cada turno el jugador elige una decisión que mueve varios a la vez.
 * Algunas simulaciones además tienen un recurso limitado (presupuesto,
 * unidades) y eventos que pasan solos entre turnos.
 *
 * La gracia educativa es que casi ninguna decisión es gratis: sube unas
 * cosas y baja otras, y ganar exige no abandonar ningún frente.
 */
export default function Simulacion({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = SIMULACIONES[juego.simulacion];

  // La dificultad no cambia el contenido: cambia qué tan exigente es la
  // meta y cuántas opciones se ven por turno.
  const exigencia = dif.id === "facil" ? -8 : dif.id === "dificil" ? 8 : 0;
  const opcionesPorTurno = dif.id === "facil" ? 3 : 4;
  const turnos = datos?.fases ? datos.fases.length : datos?.turnos || 6;

  const metas = useMemo(
    () =>
      Object.fromEntries(
        (datos?.indicadores || []).map((i) => [i.id, Math.max(25, i.meta + exigencia)])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [valores, setValores] = useState(() =>
    Object.fromEntries((datos?.indicadores || []).map((i) => [i.id, i.inicial]))
  );
  const [recurso, setRecurso] = useState(datos?.recurso?.inicial ?? null);
  const [turno, setTurno] = useState(0);
  const [retro, setRetro] = useState(null);
  const [evento, setEvento] = useState(null);
  const [usadas, setUsadas] = useState([]);
  const [cambios, setCambios] = useState({});

  const valoresRef = useRef(valores);
  const recursoRef = useRef(recurso);
  const buenasRef = useRef(0);
  const cerrado = useRef(false);

  /* Las opciones del turno: fijas si la simulación es por fases (el
     simulador de emergencia sigue un orden), al azar en las demás. */
  const opciones = useMemo(() => {
    if (!datos) return [];
    if (datos.fases) return datos.fases[Math.min(turno, datos.fases.length - 1)].decisiones;

    const libres = datos.decisiones.filter((d) => !usadas.includes(d.id));
    const fuente = libres.length >= opcionesPorTurno ? libres : datos.decisiones;
    const elegidas = revolver(fuente).slice(0, opcionesPorTurno);

    // Con presupuesto puede pasar que ninguna de las tres alcance. En ese
    // caso el jugador se quedaría atorado, así que siempre metemos una
    // opción costeable (guardar presupuesto suele serlo).
    if (recursoRef.current !== null) {
      const alcanza = (d) => (d.costo || 0) <= recursoRef.current;
      if (!elegidas.some(alcanza)) {
        const salida = datos.decisiones.filter(alcanza).sort((a, b) => (a.costo || 0) - (b.costo || 0))[0];
        if (salida) elegidas[elegidas.length - 1] = salida;
      }
    }
    return elegidas;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turno]);

  const fase = datos?.fases ? datos.fases[Math.min(turno, datos.fases.length - 1)] : null;

  function cerrar() {
    if (cerrado.current) return;
    cerrado.current = true;

    const lista = datos.indicadores;
    const logrados = lista.filter((i) => valoresRef.current[i.id] >= metas[i.id]).length;
    const completado = logrados === lista.length;
    const promedio = lista.reduce((a, i) => a + valoresRef.current[i.id], 0) / lista.length;

    if (completado) confeti({ colores: personaje?.colores, cantidad: 130 });

    onTerminar(
      construirResultado({
        puntos: Math.round(promedio * 6 + logrados * 40),
        aciertos: logrados,
        total: lista.length,
        dificultad: dif.id,
        vidasIniciales: lista.length,
        vidasRestantes: logrados,
        completado,
        familia: juego.familia,
        resumen: textoFinal(logrados, lista.length),
      })
    );
  }

  function textoFinal(logrados, total) {
    if (logrados === total) return datos.finales.excelente;
    if (logrados >= Math.ceil(total / 2)) return datos.finales.regular;
    return datos.finales.malo;
  }

  function aplicar(efectos = {}) {
    const siguientes = { ...valoresRef.current };
    Object.entries(efectos).forEach(([id, delta]) => {
      if (siguientes[id] === undefined) return;
      siguientes[id] = acotar(siguientes[id] + delta);
    });
    valoresRef.current = siguientes;
    setValores(siguientes);
    setCambios(efectos);
  }

  /**
   * Un ecosistema no se queda quieto: entre turnos, los herbívoros comen
   * plantas, los depredadores comen herbívoros y todo depende del agua.
   */
  function dinamicaEcosistema() {
    const v = { ...valoresRef.current };
    const presion = (v.herbivoros - 50) / 8;
    const caza = (v.depredadores - 45) / 9;
    const sed = (v.agua - 50) / 12;

    v.plantas = acotar(v.plantas - presion + sed + 2);
    v.herbivoros = acotar(v.herbivoros + (v.plantas - 50) / 10 - caza);
    v.depredadores = acotar(v.depredadores + (v.herbivoros - 45) / 12 - 1);
    v.insectos = acotar(v.insectos + (v.plantas - 50) / 12);
    v.agua = acotar(v.agua - 1 + (v.plantas - 50) / 20);

    valoresRef.current = v;
    setValores(v);
  }

  function elegir(decision) {
    if (retro) return;

    const costo = decision.costo || 0;
    if (recursoRef.current !== null && costo > recursoRef.current) return; // el botón ya está desactivado

    if (recursoRef.current !== null) {
      recursoRef.current = Math.max(0, recursoRef.current - costo);
      setRecurso(recursoRef.current);
    }

    aplicar(decision.efectos);
    setUsadas((u) => [...u, decision.id]);

    const suma = Object.values(decision.efectos || {}).reduce((a, b) => a + b, 0);
    const buena = suma > 0;
    if (buena) buenasRef.current += 1;
    buena ? sonido.bien() : sonido.mal();

    setRetro({
      correcto: buena,
      explicacion: decision.explicacion,
      dato: decision.dato,
      respuestaCorrecta: buena ? null : "Mira cómo se movieron los indicadores de arriba.",
    });
  }

  function continuar() {
    sonido.clic();
    setRetro(null);
    setCambios({});

    if (datos.dinamica) dinamicaEcosistema();

    const siguiente = turno + 1;
    if (siguiente >= turnos) {
      cerrar();
      return;
    }

    // evento aleatorio cada dos turnos
    if (datos.eventos && siguiente % 2 === 0) {
      const ev = datos.eventos[Math.floor(Math.random() * datos.eventos.length)];
      aplicar(ev.efectos);
      if (ev.recurso && recursoRef.current !== null) {
        recursoRef.current += ev.recurso;
        setRecurso(recursoRef.current);
      }
      setEvento(ev);
    }

    setTurno(siguiente);
  }

  if (!datos) return null;

  return (
    <div className="mini mini--simulacion">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        puntos={Object.values(valores).reduce((a, b) => a + b, 0)}
        onSalir={onSalir}
        extra={
          datos.recurso ? (
            <span className="sim__recurso">
              {datos.recurso.icono} {recurso}
            </span>
          ) : null
        }
      />

      <Progreso hechos={turno} total={turnos} texto={`Turno ${turno + 1} de ${turnos}`} />

      <div className="tablero-sim" role="group" aria-label="Indicadores">
        {datos.indicadores.map((ind) => {
          const v = valores[ind.id];
          const meta = metas[ind.id];
          const delta = cambios[ind.id];
          return (
            <div
              key={ind.id}
              className={`sim__ind ${v >= meta ? "sim__ind--ok" : ""} ${
                ind.equipo ? `sim__ind--${ind.equipo}` : ""
              }`}
            >
              <span className="sim__nombre">
                <span aria-hidden="true">{ind.icono}</span> {ind.nombre}
              </span>
              <span className="sim__barra">
                <span className="sim__relleno" style={{ width: `${v}%` }} />
                <span className="sim__meta" style={{ left: `${meta}%` }} aria-hidden="true" />
              </span>
              <span className="sim__valor">
                {v}
                {delta ? (
                  <b className={delta > 0 ? "sim__sube" : "sim__baja"}>
                    {delta > 0 ? `+${delta}` : delta}
                  </b>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      {evento && !retro && (
        <p className="sim__evento" role="status">
          <span aria-hidden="true">{evento.icono}</span> {evento.texto}
        </p>
      )}

      {retro ? (
        <div className="quiz__retro">
          <Retroalimentacion
            correcto={retro.correcto}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={retro.explicacion}
            dato={retro.dato}
          />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={continuar}>
              {turno + 1 >= turnos ? "Ver cómo quedó →" : "Siguiente turno →"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="quiz__situacion sim__pregunta">
            {fase ? (
              <>
                <strong>{fase.nombre}.</strong> {fase.pregunta}
              </>
            ) : (
              datos.escenario
            )}
          </p>

          <div className="opciones">
            {opciones.map((d) => {
              const alcanza =
                recursoRef.current === null || (d.costo || 0) <= recursoRef.current;
              return (
              <button
                key={d.id}
                onClick={() => elegir(d)}
                disabled={!alcanza}
                className={alcanza ? "" : "opcion--sin-recurso"}
                aria-label={alcanza ? undefined : `${d.texto}. No alcanza el presupuesto.`}
              >
                <span className="opciones__letra" aria-hidden="true">
                  {d.icono}
                </span>
                <span className="sim__texto">
                  {d.texto}
                  {datos.recurso && d.costo !== undefined && (
                    <b className={d.costo < 0 ? "sim__gratis" : "sim__costo"}>
                      {d.costo < 0
                        ? ` +${-d.costo} ${datos.recurso.icono}`
                        : ` −${d.costo} ${datos.recurso.icono}`}
                    </b>
                  )}
                </span>
              </button>
              );
            })}
          </div>

          {datos.recurso && (
            <p className="mini__texto mini__texto--chico sim__nota">
              Lo que no alcanza aparece en gris. Guardar presupuesto también es una jugada.
            </p>
          )}
        </>
      )}
    </div>
  );
}
