/**
 * Piezas de interfaz que comparten todos los minijuegos.
 *
 * Están aquí y no dentro de cada juego para que el HUD, el cronómetro,
 * las vidas y el marcador se vean y se comporten igual en los 20+ retos.
 * Reutilizan las clases de styles.css que ya existían (`vidas`, `marcador`,
 * `cronometro`, `boton-grande`, `ficha`...) para no romper la identidad visual.
 */

import { sonido } from "../../lib/sonido.js";
import { puedeLeer, leer } from "../../lib/voz.js";
import Icono, { Vidas } from "../../components/Icono.jsx";

/* ------------------------- escuchar en voz alta ------------------------- */

/** Botón para que el juego lea el texto. No aparece si el navegador no puede. */
export function Escuchar({ texto, etiqueta = "Escuchar" }) {
  if (!puedeLeer() || !texto) return null;
  return (
    <button type="button" className="escuchar" onClick={() => leer(texto)} aria-label={`${etiqueta} en voz alta`}>
      <Icono nombre="sonido" /> {etiqueta}
    </button>
  );
}

/* ------------------------------ encabezado ------------------------------ */

export function MarcoJuego({ juego, dificultad, vidas, vidasMax, puntos, extra, onSalir }) {
  return (
    <header className="jm__hud">
      <button className="jm__salir" onClick={onSalir} aria-label="Salir del minijuego">
        <Icono nombre="volver" />
      </button>
      <div className="jm__id">
        <span className="jm__icono" aria-hidden="true">
          {juego.icono}
        </span>
        <span className="jm__nombre">{juego.nombre}</span>
      </div>
      {typeof vidas === "number" && (
        <Vidas vidas={vidas} max={vidasMax ?? vidas} className="jm__vidas" />
      )}
      {extra}
      <span className="marcador jm__puntos" aria-label={`${puntos} puntos`}>
        {dificultad && <i className={`punto-dif punto-dif--${dificultad.id}`} aria-hidden="true" />} {puntos}
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
        <Icono nombre={correcto ? "bien" : "mal"} className="retro__marca" /> {correcto ? "¡Correcto!" : "Incorrecto"}
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
          <strong><Icono nombre="foco" /> ¿Sabías que...?</strong> {dato}
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
        <Icono nombre="volver" /> Centro de entrenamiento
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

      {record > 0 && <p className="jm__record"><Icono nombre="trofeo" /> Tu récord: {record}</p>}

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
          <i className={`punto-dif punto-dif--${d.id}`} aria-hidden="true" />
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
        {[0, 1, 2].map((i) => (
          <Icono key={i} nombre={i < estrellas ? "estrella" : "estrella-vacia"} className={`jm__estrella ${i < estrellas ? "jm__estrella--ganada" : ""}`} />
        ))}
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
            <b><Icono nombre="escudo" /> +{resultado.reward.shields}</b>
          </li>
        )}
        {resultado.reward.seeds > 0 && (
          <li>
            <span>Semillas</span>
            <b><Icono nombre="brote" /> +{resultado.reward.seeds}</b>
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
