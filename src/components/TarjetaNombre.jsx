import { useState } from "react";
import { PERSONAJES } from "../data/personajes.js";
import { crearJugador, elegirJugador, listarJugadores, jugarSinNombre } from "../lib/jugadores.js";
import { sonido } from "../lib/sonido.js";

/**
 * Tarjeta grande de la portada para escribir el nombre. Es lo primero que ve el niño:
 * un campo enorme con borde que parpadea, una flecha y «¡Listo!». Debajo, los nombres de
 * quienes ya jugaron en esta computadora para tocarlos directo.
 *
 * Con jugador elegido se vuelve un saludo con su ID y «No soy yo».
 */
const MAX_CHIPS = 8;
const LLAVE_OCULTA = "escuadron-sin-nombre";
const oculta = () => { try { return sessionStorage.getItem(LLAVE_OCULTA) === "1"; } catch { return false; } };

export default function TarjetaNombre({ jugador, onVerTodos }) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [escondida, setEscondida] = useState(oculta);
  const [nuevoId, setNuevoId] = useState(null);

  if (jugador) {
    const p = PERSONAJES[jugador.avatar] || PERSONAJES.sismo;
    return (
      <section className={`nombre nombre--hola ${nuevoId === jugador.id ? "nombre--nuevo" : ""}`} aria-label="Quién está jugando">
        <img className="nombre__cara" src={p.cara} alt="" width="56" height="56" />
        <p className="nombre__hola">
          <span>¡Hola, <strong>{jugador.nombre}</strong>!</span>
          <span className="nombre__id">Tu ID: <b className="quien__id">{jugador.id}</b>{nuevoId === jugador.id && " · ¡anótalo!"}</span>
        </p>
        <button type="button" className="nombre__cambiar" onClick={() => { sonido.clic(); onVerTodos(); }}>
          No soy {jugador.nombre.split(" ")[0]}
        </button>
      </section>
    );
  }

  if (escondida) return null;

  const lista = listarJugadores().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  function guardar(e) {
    e.preventDefault();
    setError("");
    try {
      const j = crearJugador(nombre);
      sonido.bien();
      setNuevoId(j.id);
      setNombre("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="nombre" aria-labelledby="nombre-titulo">
      <form className="nombre__form" onSubmit={guardar}>
        <h2 id="nombre-titulo" className="nombre__titulo">
          <span aria-hidden="true">✏️</span> ¡Hola! ¿Cómo te llamas?
        </h2>
        <label className="nombre__etiqueta" htmlFor="nombre-campo">
          Escribe tu nombre aquí <span aria-hidden="true">👇</span>
        </label>
        <div className="nombre__fila">
          <input
            id="nombre-campo"
            className="nombre__campo"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setError(""); }}
            maxLength={30}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            placeholder="Tu nombre"
            aria-describedby="nombre-ayuda"
          />
          <button type="submit" className="nombre__listo" disabled={nombre.trim().length < 2}>
            ¡Listo!
          </button>
        </div>
        <p id="nombre-ayuda" className="nombre__ayuda">Así se guardan tus puntos y tus medallas.</p>
        {error && <p className="cuenta__error" role="alert">{error}</p>}
      </form>

      {lista.length > 0 && (
        <div className="nombre__antes">
          <p className="nombre__subtitulo">¿Ya jugaste antes? <strong>Toca tu nombre:</strong></p>
          <ul className="nombre__chips">
            {lista.slice(0, MAX_CHIPS).map((j) => (
              <li key={j.id}>
                <button type="button" onClick={() => { sonido.clic(); elegirJugador(j.id); }}>
                  <img src={(PERSONAJES[j.avatar] || PERSONAJES.sismo).cara} alt="" width="28" height="28" />
                  {j.nombre}
                </button>
              </li>
            ))}
            {lista.length > MAX_CHIPS && (
              <li>
                <button type="button" className="nombre__mas" onClick={onVerTodos}>Ver los {lista.length} nombres</button>
              </li>
            )}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="quien__sin nombre__sin"
        onClick={() => {
          try { sessionStorage.setItem(LLAVE_OCULTA, "1"); } catch { /* nada */ }
          jugarSinNombre();
          setEscondida(true);
        }}
      >
        Jugar sin nombre
      </button>
    </section>
  );
}
