import { useMemo } from "react";
import { PERSONAJES } from "../data/personajes.js";
import { JUEGOS, FAMILIAS } from "../juegos/registro.js";
import { RANGOS, rangoPara } from "../lib/progreso.js";
import { LISTA_DIFICULTADES } from "../lib/dificultad.js";
import Icono, { ICONO_FAMILIA, iconoMoneda } from "../components/Icono.jsx";
import IconoJuego, { IconoRango } from "../components/IconoJuego.jsx";

/**
 * Mis logros: todo lo que el progreso ya guardaba, a la vista.
 * Medallas de rango, insignias de las misiones, los 46 juegos con sus
 * dificultades superadas y los números de la cartera.
 */
export default function Logros({ progreso, onSalir }) {
  const mejor = Math.max(0, ...Object.values(progreso.records || {}));
  const rango = rangoPara(mejor);
  const indiceRango = RANGOS.indexOf(rango);
  const misiones = useMemo(
    () => Object.values(PERSONAJES).flatMap((p) => p.misiones.map((m) => ({ ...m, personaje: p }))),
    []
  );
  const insignias = new Set(progreso.insignias || []);
  const ganadas = misiones.filter((m) => insignias.has(m.titulo)).length;
  const jugados = JUEGOS.filter((j) => progreso.juegos?.[j.id]?.partidas > 0).length;
  const dominados = JUEGOS.filter((j) => {
    const hechas = progreso.juegos?.[j.id]?.dificultades || [];
    const posibles = j.dificultades || LISTA_DIFICULTADES.map((d) => d.id);
    return posibles.every((d) => hechas.includes(d));
  }).length;

  return (
    <div className="pantalla logros">
      <header className="logros__cabeza">
        <button className="volver" onClick={onSalir}>
          <Icono nombre="volver" /> Volver
        </button>
        <h1>
          <Icono nombre="trofeo" /> Mis logros
        </h1>
        <dl className="logros__cifras">
          <div>
            <dt>Partidas</dt>
            <dd>{progreso.partidas || 0}</dd>
          </div>
          <div>
            <dt>
              <Icono nombre="estrella" /> XP
            </dt>
            <dd>{progreso.xp || 0}</dd>
          </div>
          <div>
            <dt>
              <Icono nombre="escudo" /> Escudos
            </dt>
            <dd>{progreso.escudos || 0}</dd>
          </div>
          <div>
            <dt>
              <Icono nombre="brote" /> Semillas
            </dt>
            <dd>{progreso.semillas || 0}</dd>
          </div>
        </dl>
      </header>

      <section className="logros__seccion">
        <h2>Rango</h2>
        <p className="logros__nota">
          Tu mejor partida: <b>{mejor}</b>. Rango: <b>{rango.nombre}</b>.
        </p>
        <ul className="logros__medallas">
          {RANGOS.map((r, i) => (
            <li key={r.nombre} className={i <= indiceRango ? "ganada" : ""}>
              <IconoRango rango={r} />
              <span>{r.nombre}</span>
              <small>{r.min} pts</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="logros__seccion">
        <h2>
          Insignias de misión <small>{ganadas} de {misiones.length}</small>
        </h2>
        <ul className="logros__insignias">
          {misiones.map((m) => {
            const tiene = insignias.has(m.titulo);
            return (
              <li key={`${m.personaje.id}-${m.id}`} className={tiene ? "ganada" : ""}>
                <Icono nombre={iconoMoneda(m.personaje.moneda)} />
                <span>{m.titulo}</span>
                <span className="visualmente-oculto">{tiene ? "ganada" : "pendiente"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="logros__seccion">
        <h2>
          Minijuegos <small>{jugados} jugados · {dominados} dominados</small>
        </h2>
        <p className="logros__nota">Un juego queda dominado al superarlo en todas sus dificultades.</p>
        {Object.values(FAMILIAS).map((f) => (
          <div key={f.id} className="logros__familia">
            <h3>
              <Icono nombre={ICONO_FAMILIA[f.id]} /> {f.nombre}
            </h3>
            <ul className="logros__juegos">
              {JUEGOS.filter((j) => j.familia === f.id).map((j) => {
                const datos = progreso.juegos?.[j.id];
                const hechas = datos?.dificultades || [];
                const posibles = j.dificultades
                  ? LISTA_DIFICULTADES.filter((d) => j.dificultades.includes(d.id))
                  : LISTA_DIFICULTADES;
                return (
                  <li key={j.id} className={datos?.partidas ? "jugado" : ""} title={j.nombre}>
                    <IconoJuego juego={j} />
                    <span className="logros__juego-nombre">{j.nombre}</span>
                    <span className="logros__dif" aria-label={`${hechas.length} de ${posibles.length} dificultades`}>
                      {posibles.map((d) => (
                        <i key={d.id} className={`punto-dif punto-dif--${d.id} ${hechas.includes(d.id) ? "hecha" : ""}`} />
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
