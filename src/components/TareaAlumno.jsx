import Icono from "./Icono.jsx";
import IconoJuego from "./IconoJuego.jsx";
import { POR_ID } from "../juegos/registro.js";

/**
 * La tarea que puso el maestro, en la portada del alumno que entró con su cuenta de grupo.
 * Cada minijuego se abre con un toque y queda palomeado cuando se jugó después de que el
 * maestro puso la tarea (progreso.juegos[id].jugadoEn ≥ tarea.desde).
 */
export function tareaHecha(tarea, progreso, id) {
  return (progreso?.juegos?.[id]?.jugadoEn || "") >= (tarea?.desde || "9999");
}

export default function TareaAlumno({ tarea, progreso, onJugar }) {
  const juegos = (tarea?.juegos || []).map((id) => POR_ID[id]).filter(Boolean);
  if (!juegos.length) return null;
  const hechos = juegos.filter((j) => tareaHecha(tarea, progreso, j.id)).length;
  const lista = hechos === juegos.length;

  return (
    <section className={`tarea-alumno ${lista ? "tarea-alumno--lista" : ""}`} aria-labelledby="tarea-alumno-titulo">
      <h2 id="tarea-alumno-titulo">
        <Icono nombre={lista ? "trofeo" : "estrella"} /> {lista ? "¡Terminaste la tarea!" : "Tarea de tu maestro"}
        <small>{hechos} de {juegos.length}</small>
      </h2>
      {tarea.nota && <p className="tarea-alumno__nota">«{tarea.nota}»</p>}
      <ul>
        {juegos.map((j) => {
          const hecho = tareaHecha(tarea, progreso, j.id);
          return (
            <li key={j.id}>
              <button className={hecho ? "hecho" : ""} onClick={() => onJugar(j.id)}>
                <IconoJuego juego={j} />
                <span>{j.nombre}</span>
                {hecho ? (
                  <span className="tarea-alumno__marca"><Icono nombre="bien" /><span className="visualmente-oculto"> (hecho)</span></span>
                ) : (
                  <Icono nombre="siguiente" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
