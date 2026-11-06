import { useState, useEffect, useRef } from "react";
import { PERSONAJES } from "../data/personajes.js";
import {
  listarJugadores, crearJugador, elegirJugador, jugarSinNombre, borrarJugador, jugadorActual,
} from "../lib/jugadores.js";
import { sonido } from "../lib/sonido.js";
import Icono from "./Icono.jsx";

/**
 * «¿Quién juega?»: para la computadora del salón, donde los niños no tienen cuenta.
 * Tocan su nombre en la lista o se agregan con su nombre; cada quien recibe un ID y
 * guarda su propio progreso en esta computadora.
 */
export default function QuienJuega({ onListo }) {
  const [lista, setLista] = useState(() => listarJugadores());
  const [nuevo, setNuevo] = useState(() => listarJugadores().length === 0);
  const [nombre, setNombre] = useState("");
  const [avatar, setAvatar] = useState("sismo");
  const [error, setError] = useState("");
  const [administrar, setAdministrar] = useState(false);
  const [aBorrar, setABorrar] = useState(null);
  const [creado, setCreado] = useState(null);
  const actual = jugadorActual();
  const primeroRef = useRef(null);

  useEffect(() => {
    primeroRef.current?.focus();
    const alTeclear = (e) => e.key === "Escape" && onListo();
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onListo, nuevo]);

  const ordenados = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  function elegir(id) {
    sonido.clic();
    elegirJugador(id);
    onListo();
  }

  function agregar(e) {
    e.preventDefault();
    setError("");
    try {
      const j = crearJugador(nombre, avatar);
      sonido.bien();
      setCreado(j);
    } catch (err) {
      setError(err.message);
    }
  }

  if (creado) {
    return (
      <Marco titulo="¡Listo!" onCerrar={onListo}>
        <div className="quien__creado">
          <img src={PERSONAJES[creado.avatar].cara} alt="" width="72" height="72" />
          <p className="cuenta__apodo">{creado.nombre}</p>
          <p>Tu ID de jugador es</p>
          <p className="quien__id-grande" aria-label={`ID ${creado.id.split("").join(" ")}`}>{creado.id}</p>
          <p className="cuenta__nota">Anótalo: con él tu maestro sabe cuáles son tus resultados.</p>
          <button className="boton-grande" onClick={onListo} ref={primeroRef}>¡A jugar! <Icono nombre="siguiente" /></button>
        </div>
      </Marco>
    );
  }

  return (
    <Marco titulo="¿Quién juega?" onCerrar={onListo}>
      {!nuevo && ordenados.length > 0 && (
        <>
          <p className="cuenta__nota">Toca tu nombre. Cada quien guarda sus propios récords en esta computadora.</p>
          <ul className="quien__lista">
            {ordenados.map((j, i) => (
              <li key={j.id}>
                {aBorrar === j.id ? (
                  <span className="quien__confirmar">
                    ¿Borrar a {j.nombre} y su progreso?
                    <button className="maestro__peligro" onClick={() => { borrarJugador(j.id); setLista(listarJugadores()); setABorrar(null); }}>Sí, borrar</button>
                    <button onClick={() => setABorrar(null)}>No</button>
                  </span>
                ) : (
                  <>
                    <button
                      className={`quien__jugador ${actual?.id === j.id ? "quien__jugador--actual" : ""}`}
                      onClick={() => elegir(j.id)}
                      ref={i === 0 ? primeroRef : null}
                    >
                      <img src={PERSONAJES[j.avatar]?.cara || PERSONAJES.sismo.cara} alt="" width="40" height="40" />
                      <span className="quien__nombre">
                        <strong>{j.nombre}</strong>
                        <small>ID {j.id}</small>
                      </span>
                    </button>
                    {administrar && (
                      <button className="quien__borrar" onClick={() => setABorrar(j.id)} aria-label={`Borrar a ${j.nombre}`}>
                        <Icono nombre="mal" />
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          <button className="boton-grande quien__nuevo" onClick={() => { setNuevo(true); setError(""); }}>
            Soy nuevo: escribir mi nombre
          </button>
        </>
      )}

      {nuevo && (
        <form className="cuenta__form" onSubmit={agregar}>
          <label className="cuenta__campo" htmlFor="quien-nombre">
            <span>Tu nombre</span>
            <input
              id="quien-nombre"
              ref={primeroRef}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={30}
              minLength={2}
              autoComplete="off"
              placeholder="Ej. Ana López"
              required
            />
            <small>Solo se guarda en esta computadora.</small>
          </label>
          <fieldset className="cuenta__avatares">
            <legend>Tu compañero</legend>
            {Object.values(PERSONAJES).map((p) => (
              <label key={p.id} className={avatar === p.id ? "elegido" : ""}>
                <input type="radio" name="quien-avatar" value={p.id} checked={avatar === p.id} onChange={() => setAvatar(p.id)} />
                <img src={p.cara} alt="" width="48" height="48" />
                {p.nombre}
              </label>
            ))}
          </fieldset>
          {error && <p className="cuenta__error" role="alert">{error}</p>}
          <button className="boton-grande" type="submit">Empezar a jugar</button>
          {ordenados.length > 0 && (
            <button type="button" className="cuenta__salir" onClick={() => { setNuevo(false); setError(""); }}>
              Ya estoy en la lista
            </button>
          )}
        </form>
      )}

      <div className="quien__pie">
        <button type="button" className="quien__sin" onClick={() => { jugarSinNombre(); onListo(); }}>
          Jugar sin nombre
        </button>
        {!nuevo && ordenados.length > 0 && (
          <button type="button" className="quien__sin" onClick={() => setAdministrar((a) => !a)}>
            {administrar ? "Listo" : "Borrar jugadores"}
          </button>
        )}
      </div>
    </Marco>
  );
}

function Marco({ titulo, onCerrar, children }) {
  return (
    <div className="ajustes-fondo" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="ajustes cuenta quien" role="dialog" aria-modal="true" aria-labelledby="quien-titulo">
        <header className="ajustes__cabeza">
          <h2 id="quien-titulo"><Icono nombre="grupo" /> {titulo}</h2>
          <button className="ajustes__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="mal" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
