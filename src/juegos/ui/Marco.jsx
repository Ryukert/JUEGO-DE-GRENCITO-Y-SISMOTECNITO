/**
 * Piezas de interfaz que comparten todos los minijuegos.
 *
 * Están aquí y no dentro de cada juego para que el HUD, el cronómetro,
 * las vidas y el marcador se vean y se comporten igual en los 20+ retos.
 * Reutilizan las clases de styles.css que ya existían (`vidas`, `marcador`,
 * `cronometro`, `boton-grande`, `ficha`...) para no romper la identidad visual.
 */

import { sonido } from "../../lib/sonido.js";

/* ------------------------------ encabezado ------------------------------ */

export function MarcoJuego({ juego, dificultad, vidas, vidasMax, puntos, extra, onSalir }) {
  return (
    <header className="jm__hud">
      <button className="jm__salir" onClick={onSalir} aria-label="Salir del minijuego">
        ←
      </button>
      <div className="jm__id">
        <span className="jm__icono" aria-hidden="true">
          {juego.icono}
        </span>
        <span className="jm__nombre">{juego.nombre}</span>
      </div>
      {typeof vidas === "number" && (
        <span className="vidas jm__vidas" aria-label={`${Math.max(0, vidas)} vidas`}>
          {"❤️".repeat(Math.max(0, vidas))}
          {"🖤".repeat(Math.max(0, (vidasMax ?? vidas) - vidas))}
        </span>
      )}
      {extra}
      <span className="marcador jm__puntos" aria-label={`${puntos} puntos`}>
        <span aria-hidden="true">{dificultad?.icono}</span> {puntos}
      </span>
    </header>
  );
}

/* ------------------------------ cronómetro ------------------------------ */

export function Cronometro({ tiempo, total, etiqueta = true }) {
  const porcentaje = total > 0 ? Math.max(0, Math.min(100, (tiempo / total) * 100)) : 0;
  return (
    <div
      className="cronometro"
      role="timer"
      aria-label={`Quedan ${Math.ceil(tiempo)} segundos`}
    >
      <div
        className={`cronometro__barra ${porcentaje < 35 ? "cronometro__barra--peligro" : ""}`}
        style={{ width: `${porcentaje}%` }}
      />
      {etiqueta && <span className="cronometro__numero">{Math.ceil(tiempo)}</span>}
    </div>
  );
}

/* ----------------------------- progreso ------------------------------ */

export function Progreso({ hechos, total, texto }) {
  return (
    <div className="jm__progreso">
      <div className="jm__pasos" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`paso ${i < hechos ? "paso--hecho" : ""}`} />
        ))}
      </div>
      {texto && <span className="jm__progreso-texto">{texto}</span>}
    </div>
  );
}

/* ------------------------------ avisos -------------------------------- */

export function Aviso({ aviso }) {
  if (!aviso) return null;
  return (
    <div className={`aviso-flotante aviso-flotante--${aviso.tipo}`} role="status">
      {aviso.texto}
    </div>
  );
}

/* ------------------- retroalimentación educativa ---------------------- */

/**
 * Lo importante del proyecto: nunca decir solo "incorrecto".
 * Siempre la respuesta correcta y, cuando hay, el "¿sabías que...?".
 */
export function Retroalimentacion({ correcto, respuestaCorrecta, explicacion, dato, ganados }) {
  return (
    <div
      className={`retro ${correcto ? "retro--bien" : "retro--mal"}`}
      role="status"
      aria-live="polite"
    >
      <p className="retro__titulo">
        {correcto ? "✅ ¡Correcto!" : "❌ Incorrecto"}
        {correcto && ganados > 0 && <b className="retro__puntos"> +{ganados}</b>}
      </p>

      {!correcto && respuestaCorrecta && (
        <p className="retro__respuesta">
          <strong>Respuesta correcta:</strong> {respuestaCorrecta}
        </p>
      )}

      {explicacion && <p className="retro__texto">{explicacion}</p>}

      {dato && (
        <p className="retro__dato">
          <strong>💡 ¿Sabías que...?</strong> {dato}
        </p>
      )}
    </div>
  );
}

/* -------------------- instrucciones + dificultad ---------------------- */

export function Instrucciones({
  juego,
  personaje,
  dificultad,
  onDificultad,
  onEmpezar,
  onSalir,
  record = 0,
  dificultades,
}) {
  return (
    <div className="mini mini--intro jm__intro">
      <button className="volver" onClick={onSalir}>
        ← Centro de entrenamiento
      </button>

      {personaje?.cuerpo && <img className="mini__figura flota" src={personaje.cuerpo} alt="" />}

      <h2>
        <span aria-hidden="true">{juego.icono}</span> {juego.nombre}
      </h2>
      <p className="mini__texto">{juego.descripcion}</p>
      {juego.comoSeJuega && (
        <p className="mini__texto mini__texto--chico">{juego.comoSeJuega}</p>
      )}

      <SelectorDificultad
        valor={dificultad}
        opciones={dificultades}
        onCambiar={onDificultad}
      />

      {record > 0 && <p className="jm__record">🏆 Tu récord: {record}</p>}

      <button
        className="boton-grande"
        onClick={() => {
          sonido.despertar();
          sonido.clic();
          onEmpezar();
        }}
      >
        ¡Empezar!
      </button>
    </div>
  );
}

export function SelectorDificultad({ valor, opciones, onCambiar }) {
  return (
    <div
      className="dificultades"
      role="radiogroup"
      aria-label="Elige la dificultad"
    >
      {opciones.map((d) => (
        <button
          key={d.id}
          role="radio"
          aria-checked={valor === d.id}
          className={`dificultad ${valor === d.id ? "dificultad--on" : ""}`}
          onClick={() => {
            sonido.clic();
            onCambiar(d.id);
          }}
        >
          <span aria-hidden="true">{d.icono}</span>
          <strong>{d.nombre}</strong>
          <small>{d.para}</small>
        </button>
      ))}
    </div>
  );
}

/* --------------------------- resultado final --------------------------- */

export function Resultado({ juego, personaje, resultado, estrellas, nuevoRecord, onOtra, onSalir }) {
  return (
    <div className="mini mini--intro jm__resultado">
      {personaje?.cuerpo && <img className="mini__figura flota" src={personaje.cuerpo} alt="" />}

      <p className="jm__estrellas" aria-label={`${estrellas} de 3 estrellas`}>
        {"⭐".repeat(estrellas)}
        {"☆".repeat(3 - estrellas)}
      </p>

      <h2>{resultado.completed ? "¡Reto superado!" : "Se acabó"}</h2>
      <p className="jm__marcador-final">
        {resultado.score} <small>puntos</small>
      </p>

      {nuevoRecord && <p className="final__record--nuevo">¡Récord nuevo en {juego.nombre}!</p>}

      <ul className="jm__desglose">
        <li>
          <span>Precisión</span>
          <b>{resultado.accuracy}%</b>
        </li>
        <li>
          <span>XP ganada</span>
          <b>+{resultado.xp}</b>
        </li>
        {resultado.reward.shields > 0 && (
          <li>
            <span>Escudos</span>
            <b>🛡️ +{resultado.reward.shields}</b>
          </li>
        )}
        {resultado.reward.seeds > 0 && (
          <li>
            <span>Semillas</span>
            <b>🌱 +{resultado.reward.seeds}</b>
          </li>
        )}
        <li>
          <span>Vidas perdidas</span>
          <b>{resultado.livesLost}</b>
        </li>
      </ul>

      <div className="opciones opciones--centro">
        <button className="boton-grande" onClick={onOtra}>
          Otra vez
        </button>
        <button onClick={onSalir}>Volver al centro</button>
      </div>
    </div>
  );
}
