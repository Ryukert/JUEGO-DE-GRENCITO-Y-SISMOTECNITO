import { useState, useRef, useEffect } from "react";

export default function Juego({
  personaje: p,
  mision,
  nivel,
  mensajes,
  opciones,
  puntos,
  cargando,
  temblor,
  sinConexion,
  onResponder,
  onSalir,
}) {
  const [texto, setTexto] = useState("");
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, cargando, opciones]);

  function enviar(e) {
    e?.preventDefault();
    if (!texto.trim()) return;
    onResponder(texto);
    setTexto("");
  }

  return (
    <div className={`pantalla juego ${temblor ? "tiembla" : ""}`}>
      <header className="hud">
        <button className="hud__salir" onClick={onSalir} aria-label="Volver al inicio">
          ←
        </button>
        <img className="cara" src={p.cara} alt="" width="44" height="44" />
        <div className="hud__texto">
          <h1>{p.nombre}</h1>
          <p>{mision.lugar}</p>
        </div>
        <div className="marcador" aria-label={`${puntos} ${p.moneda}`}>
          <span aria-hidden="true">{p.monedaIcono}</span> {puntos}
        </div>
      </header>

      <div className="barra">
        <div className="barra__pasos" aria-hidden="true">
          {p.misiones.map((m, i) => (
            <span key={m.id} className={`paso ${i <= nivel ? "paso--on" : ""}`} />
          ))}
        </div>
        <span className="barra__texto">
          Misión {nivel + 1} de {p.misiones.length}: {mision.titulo}
        </span>
      </div>

      <div className="chat" role="log" aria-live="polite">
        {mensajes.map((m, i) =>
          m.de === "sistema" ? (
            <p className="separador" key={i}>{m.texto}</p>
          ) : (
            <div className={`fila ${m.de === "yo" ? "fila--mia" : ""}`} key={i}>
              {m.de === "bot" && (
                <img className="cara" src={p.cara} alt="" width="44" height="44" />
              )}
              <div className={`globo ${m.de === "yo" ? "globo--mio" : ""}`}>
                {m.reaccion && <span className="reaccion">{m.reaccion}</span>}
                <p>{m.texto}</p>
                {m.dato && <p className="dato">🔎 {m.dato}</p>}
                {m.ganados > 0 && (
                  <p className="ganados">+{m.ganados} {p.moneda}</p>
                )}
              </div>
            </div>
          )
        )}

        {cargando && (
          <div className="fila">
            <img className="cara" src={p.cara} alt="" width="44" height="44" />
            <div className="globo">
              <span className="puntitos"><i /><i /><i /></span>
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="pie">
        {sinConexion && (
          <p className="aviso">
            Sin conexión con el servidor: {p.nombre} está usando sus respuestas
            de repuesto.
          </p>
        )}

        {opciones.length > 0 && !cargando && (
          <div className="opciones">
            {opciones.map((o, i) => (
              <button key={i} onClick={() => onResponder(o)}>{o}</button>
            ))}
          </div>
        )}

        <form className="escribe" onSubmit={enviar}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Pregúntale algo a ${p.nombre}...`}
            aria-label={`Escribe tu mensaje para ${p.nombre}`}
            disabled={cargando}
            enterKeyHint="send"
            autoComplete="off"
          />
          <button type="submit" className="enviar" disabled={cargando || !texto.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
