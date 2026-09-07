import { useState, useCallback } from "react";
import { LISTA_DIFICULTADES, leerDificultad, dificultadPorGrado } from "../lib/dificultad.js";
import { estrellas as calcularEstrellas } from "../lib/recompensas.js";
import { registrarMinijuego, recordDeJuego } from "../lib/progreso.js";
import { sonido } from "../lib/sonido.js";
import { confeti } from "../lib/confeti.js";
import { Instrucciones, Resultado } from "./ui/Marco.jsx";

/**
 * Envoltura común de todos los minijuegos.
 *
 * Se encarga de lo que sería igual en los veinte juegos: elegir dificultad,
 * mostrar instrucciones, montar el motor, guardar el resultado en el
 * progreso y enseñar la pantalla de recompensa. Los motores solo juegan.
 */
export default function PantallaMinijuego({ juego, personaje, grado, progreso, onSalir, onProgreso }) {
  const [fase, setFase] = useState("intro");
  const [dificultad, setDificultad] = useState(
    () => juego.dificultades?.[0] || dificultadPorGrado(grado)
  );
  const [resultado, setResultado] = useState(null);
  const [nuevoRecord, setNuevoRecord] = useState(false);
  const [ronda, setRonda] = useState(0); // fuerza el remontaje del motor

  const Motor = juego.motor;
  const dif = leerDificultad(dificultad);
  const record = recordDeJuego(progreso, juego.id);

  const disponibles = juego.dificultades
    ? LISTA_DIFICULTADES.filter((d) => juego.dificultades.includes(d.id))
    : LISTA_DIFICULTADES;

  const terminar = useCallback(
    (res) => {
      const guardado = registrarMinijuego(juego.id, res);
      setResultado(res);
      setNuevoRecord(guardado.nuevoRecord);
      onProgreso?.(guardado.progreso);
      setFase("fin");
      if (res.completed) {
        sonido.victoria();
        confeti({ colores: personaje?.colores, cantidad: res.accuracy >= 90 ? 120 : 70 });
      } else {
        sonido.alarma();
      }
    },
    [juego.id, onProgreso, personaje]
  );

  if (fase === "intro") {
    return (
      <div className="pantalla juego juego--mini">
        <Instrucciones
          juego={juego}
          personaje={personaje}
          dificultad={dificultad}
          dificultades={disponibles}
          onDificultad={setDificultad}
          record={record}
          onEmpezar={() => {
            setRonda((r) => r + 1);
            setFase("jugando");
          }}
          onSalir={onSalir}
        />
      </div>
    );
  }

  if (fase === "fin" && resultado) {
    return (
      <div className="pantalla juego juego--mini">
        <Resultado
          juego={juego}
          personaje={personaje}
          resultado={resultado}
          estrellas={calcularEstrellas(resultado)}
          nuevoRecord={nuevoRecord}
          onOtra={() => {
            sonido.clic();
            setResultado(null);
            setFase("intro");
          }}
          onSalir={onSalir}
        />
      </div>
    );
  }

  return (
    <div className="pantalla juego juego--mini">
      <Motor
        key={`${juego.id}-${dificultad}-${ronda}`}
        juego={juego}
        personaje={personaje}
        dif={dif}
        onTerminar={terminar}
        onSalir={onSalir}
      />
    </div>
  );
}
