import Reto from "./Reto.jsx";
import Simulacro from "./minijuegos/Simulacro.jsx";
import Basura from "./minijuegos/Basura.jsx";
import Memorama from "./minijuegos/Memorama.jsx";
import { GRADOS } from "../data/personajes.js";

export default function Juego({
  personaje: p,
  grado,
  mision,
  nivel,
  puntos,
  vidas,
  racha,
  temblor,
  sonidoOn,
  onSonido,
  onPuntos,
  onFallo,
  onFinMision,
  onSalir,
}) {
  const vidasMax = GRADOS[grado].vidas;

  return (
    <div className={`pantalla juego ${temblor ? "tiembla" : ""}`}>
      <header className="hud">
        <button className="hud__icono" onClick={onSalir} aria-label="Volver al inicio">←</button>
        <img className="cara" src={p.cara} alt="" width="44" height="44" />
        <div className="hud__texto">
          <h1>{p.nombre}</h1>
          <p className="vidas" aria-label={`${vidas} vidas`}>
            {"❤️".repeat(Math.max(0, vidas))}
            {"🖤".repeat(Math.max(0, vidasMax - vidas))}
            {racha >= 2 && <strong className="racha"> 🔥 racha x{racha}</strong>}
          </p>
        </div>
        <button
          className="hud__icono"
          onClick={onSonido}
          aria-label={sonidoOn ? "Apagar sonido" : "Encender sonido"}
        >
          {sonidoOn ? "🔊" : "🔇"}
        </button>
        <div className="marcador">
          <span aria-hidden="true">{p.monedaIcono}</span> {puntos}
        </div>
      </header>

      <div className="barra">
        <div className="barra__pasos" aria-hidden="true">
          {p.misiones.map((m, i) => (
            <span
              key={m.id}
              className={`paso ${i < nivel ? "paso--hecho" : ""} ${i === nivel ? "paso--on" : ""}`}
            />
          ))}
        </div>
        <span className="barra__texto">
          {mision.tipo === "minijuego" ? "⚡ " : ""}
          {nivel + 1}/{p.misiones.length} · {mision.titulo}
        </span>
      </div>

      {mision.tipo === "minijuego" ? (
        <div className="mini-envoltura">
          {mision.juego === "simulacro" && (
            <Simulacro personaje={p} grado={grado} vidas={vidas} onTerminar={onFinMision} />
          )}
          {mision.juego === "basura" && (
            <Basura personaje={p} grado={grado} vidas={vidas} onTerminar={onFinMision} />
          )}
          {mision.juego === "memorama" && (
            <Memorama personaje={p} grado={grado} vidas={vidas} onTerminar={onFinMision} />
          )}
        </div>
      ) : (
        <Reto
          key={mision.id}
          personaje={p}
          grado={grado}
          mision={mision}
          vidas={vidas}
          puntos={puntos}
          racha={racha}
          onPuntos={onPuntos}
          onFallo={onFallo}
          onFin={() => onFinMision({ exito: true })}
        />
      )}
    </div>
  );
}
