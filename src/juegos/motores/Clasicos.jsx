import Memorama from "../../components/minijuegos/Memorama.jsx";
import Simulacro from "../../components/minijuegos/Simulacro.jsx";
import Basura from "../../components/minijuegos/Basura.jsx";
import { construirResultado } from "../../lib/recompensas.js";

/**
 * Los tres minijuegos que ya existían siguen intactos: se siguen usando en
 * las misiones exactamente como antes, con su contrato original
 * `{ personaje, grado, vidas, onTerminar({ puntos, vidasRestantes, exito }) }`.
 *
 * Estos adaptadores solo los traducen al contrato nuevo para que también
 * se puedan jugar desde el Centro de entrenamiento con dificultad propia.
 * Ni una línea de esos componentes se modificó.
 */

function adaptar(Componente) {
  return function Adaptado({ juego, personaje, dif, onTerminar, onSalir }) {
    // El grado que esperan los juegos viejos se deduce de la dificultad.
    const grado = dif.id === "facil" ? "primaria" : "secundaria";

    return (
      <div className="mini-envoltura mini-envoltura--clasico">
        <button className="volver volver--flotante" onClick={onSalir}>
          ← Salir
        </button>
        <Componente
          personaje={personaje}
          grado={grado}
          vidas={dif.vidas}
          onTerminar={(viejo) =>
            onTerminar(
              construirResultado({
                puntos: viejo.puntos || 0,
                aciertos: viejo.exito ? 1 : 0,
                total: 1,
                dificultad: dif.id,
                vidasIniciales: dif.vidas,
                vidasRestantes: viejo.vidasRestantes ?? 0,
                completado: !!viejo.exito,
                familia: juego.familia,
                resumen: viejo.resumen,
              })
            )
          }
        />
      </div>
    );
  };
}

export const MemoramaCentro = adaptar(Memorama);
export const SimulacroCentro = adaptar(Simulacro);
export const BasuraCentro = adaptar(Basura);
