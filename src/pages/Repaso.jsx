import { useState } from "react";
import { PERSONAJES } from "../data/personajes.js";
import Reto from "../components/Reto.jsx";
import Icono from "../components/Icono.jsx";
import { leerProgreso } from "../lib/progreso.js";
import { pendientesDeRepaso, preguntaDeRepaso, POR_RONDA } from "../lib/repaso.js";
import { sonido } from "../lib/sonido.js";

/**
 * Repasar lo que fallé: hasta POR_RONDA preguntas de misión que el jugador ha fallado, de la
 * más fallada a la menos. Se juegan igual que en la misión (reloj, explicación, Escuchar),
 * sin vidas ni puntos: aquí lo que cuenta es dejarlas bien. Acertar una la quita del repaso
 * (Reto llama a registrarRespuesta).
 */
export default function Repaso({ grado, onSalir, onProgreso }) {
  const [ronda, setRonda] = useState(() => pendientesDeRepaso(leerProgreso()).slice(0, POR_RONDA));
  const [indice, setIndice] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [vuelta, setVuelta] = useState(0);   // cambia la key para volver a montar todo en otra ronda

  const terminado = indice >= ronda.length;

  function otraRonda() {
    sonido.clic();
    setRonda(pendientesDeRepaso(leerProgreso()).slice(0, POR_RONDA));
    setIndice(0);
    setAciertos(0);
    setVuelta((v) => v + 1);
  }

  function salir() {
    onProgreso?.(leerProgreso());
    onSalir();
  }

  if (ronda.length === 0 || terminado) {
    const quedan = pendientesDeRepaso(leerProgreso()).length;
    return (
      <div className="pantalla final repaso-fin" key={vuelta}>
        <Icono nombre="trofeo" />
        <h2>{ronda.length === 0 ? "No tienes nada que repasar" : "¡Repaso terminado!"}</h2>
        {ronda.length > 0 && (
          <p className="final__record">
            Dejaste bien {aciertos} de {ronda.length}.{" "}
            {quedan > 0 ? `Te ${quedan === 1 ? "queda 1 pregunta" : `quedan ${quedan} preguntas`} por repasar.` : "Ya no te queda ninguna pendiente."}
          </p>
        )}
        {ronda.length === 0 && (
          <p className="final__record">Cuando falles una pregunta de las misiones, aquí podrás volver a intentarla.</p>
        )}
        <div className="opciones opciones--centro">
          {quedan > 0 && (
            <button className="boton-grande" onClick={otraRonda}>
              Repasar otra vez <Icono nombre="siguiente" />
            </button>
          )}
          <button onClick={salir}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  const actual = ronda[indice];
  const p = PERSONAJES[actual.personaje];

  return (
    <div className="pantalla juego repaso" key={vuelta}>
      <header className="hud">
        <button className="hud__icono" onClick={salir} aria-label="Salir del repaso">
          <Icono nombre="volver" />
        </button>
        <img className="cara" src={p.cara} alt="" width="44" height="44" />
        <div className="hud__texto">
          <h1>Repaso</h1>
          <p className="hud__estado">
            {actual.bono ? "Pregunta de bonificación" : actual.reto.titulo} · {p.nombre}
          </p>
        </div>
      </header>

      <div className="barra">
        <div className="barra__pasos" aria-hidden="true">
          {ronda.map((r, i) => (
            <span key={r.clave} className={`paso ${i < indice ? "paso--hecho" : ""} ${i === indice ? "paso--on" : ""}`} />
          ))}
        </div>
        <span className="barra__texto">
          {indice + 1}/{ronda.length} · la fallaste {actual.pendientes === 1 ? "1 vez" : `${actual.pendientes} veces`}
        </span>
      </div>

      <Reto
        key={actual.clave}
        personaje={p}
        grado={grado}
        mision={preguntaDeRepaso(actual)}
        racha={0}
        esBonificacion={actual.bono}
        textoSeguir={indice + 1 < ronda.length ? "Siguiente pregunta" : "Ver cómo me fue"}
        onPuntos={() => setAciertos((n) => n + 1)}
        onFallo={() => {}}
        onFin={() => setIndice((i) => i + 1)}
      />
    </div>
  );
}
