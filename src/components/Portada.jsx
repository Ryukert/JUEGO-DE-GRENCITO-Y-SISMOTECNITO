import { PERSONAJES } from "../data/personajes.js";

export default function Portada({ onElegir }) {
  return (
    <div className="pantalla portada">
      <header className="portada__intro">
        <h1>Escuadrón Tecnito y Greencito</h1>
        <p>
          Dos amigos, dos misiones. Uno te enseña qué hacer cuando la tierra se
          mueve; el otro, cómo cuidar el lugar donde vives.
        </p>
      </header>

      <div className="cartas">
        {Object.values(PERSONAJES).map((p) => (
          <button
            key={p.id}
            className={`carta carta--${p.id}`}
            onClick={() => onElegir(p.id)}
          >
            <img
              className="carta__figura flota"
              src={p.cuerpo}
              alt={p.nombre}
              width="340"
              height={p.id === "sismo" ? 571 : 436}
            />
            <h2>{p.nombre}</h2>
            <p>{p.resumen}</p>
            <span className="carta__cta">Jugar 3 misiones</span>
          </button>
        ))}
      </div>

      <p className="portada__pie">
        Hecho para niñas y niños de 8 a 12 años. Cada partida son tres retos y
        puedes preguntarle lo que quieras al personaje.
      </p>
    </div>
  );
}
