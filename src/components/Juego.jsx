import Reto from "./Reto.jsx";
import Simulacro from "./minijuegos/Simulacro.jsx";
import Basura from "./minijuegos/Basura.jsx";
import Memorama from "./minijuegos/Memorama.jsx";
import { GRADOS } from "../data/personajes.js";
import Icono, { Vidas, iconoMoneda } from "./Icono.jsx";

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
  record = 0,
}) {
  const vidasMax = GRADOS[grado].vidas;

  return (
    <div className="mesa">
      {/* en pantallas anchas: la partida a un lado de la consola (en celular no se muestra) */}
      <aside className="mesa__lado" aria-label="Tu partida">
        <h2>Tu partida</h2>
        <p className="mesa__grado">
          {GRADOS[grado].nombre} · {p.nombre}
        </p>
        <ol className="mesa__misiones">
          {p.misiones.map((m, i) => (
            <li key={m.id} className={i < nivel ? "hecha" : i === nivel ? "actual" : ""}>
              <span className="mesa__marca" aria-hidden="true">
                {i < nivel ? <Icono nombre="bien" /> : m.tipo === "minijuego" ? <Icono nombre="rayo" /> : i + 1}
              </span>
              <span>
                {m.titulo}
                <span className="visualmente-oculto">{i < nivel ? " (hecha)" : i === nivel ? " (ahora)" : ""}</span>
              </span>
            </li>
          ))}
        </ol>
        <dl className="mesa__datos">
          <div>
            <dt>Puntos</dt>
            <dd>
              <Icono nombre={iconoMoneda(p.moneda)} /> {puntos}
            </dd>
          </div>
          <div>
            <dt>Racha</dt>
            <dd>
              <Icono nombre="fuego" /> {racha}
            </dd>
          </div>
          <div>
            <dt>Récord</dt>
            <dd>
              <Icono nombre="trofeo" /> {record}
            </dd>
          </div>
        </dl>
        <p className="mesa__atajos">
          <kbd>1</kbd>–<kbd>4</kbd> o <kbd>A</kbd>–<kbd>D</kbd> para responder
          <br />
          <kbd>Enter</kbd> para seguir
        </p>
      </aside>

    <div className={`pantalla juego ${temblor ? "tiembla" : ""}`}>
      <header className="hud">
        <button className="hud__icono" onClick={onSalir} aria-label="Volver al inicio"><Icono nombre="volver" /></button>
        <img className="cara" src={p.cara} alt="" width="44" height="44" />
        <div className="hud__texto">
          <h1>{p.nombre}</h1>
          <p className="hud__estado">
            <Vidas vidas={vidas} max={vidasMax} />
            {/* key: la etiqueta vuelve a saltar cada vez que la racha sube */}
            {racha >= 2 && (
              <strong className="racha" key={racha}>
                <Icono nombre="fuego" /> racha x{racha}
              </strong>
            )}
          </p>
        </div>
        <button
          className="hud__icono"
          onClick={onSonido}
          aria-label={sonidoOn ? "Apagar sonido" : "Encender sonido"}
        >
          <Icono nombre={sonidoOn ? "sonido" : "silencio"} />
        </button>
        <div className="marcador">
          <Icono nombre={iconoMoneda(p.moneda)} /> {puntos}
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
          {mision.tipo === "minijuego" && <Icono nombre="rayo" />}
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
    </div>
  );
}
