import { useState, useMemo, useRef } from "react";
import { ROMPECABEZAS } from "../../data/juegos/retos.js";
import { segundos } from "../../lib/dificultad.js";
import { construirResultado } from "../../lib/recompensas.js";
import { useCronometro, useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Retroalimentacion } from "../ui/Marco.jsx";

const azar = (n) => Math.floor(Math.random() * n);

/**
 * Rompecabezas deslizante sobre las imágenes que ya trae el proyecto.
 *
 * Se revuelve haciendo movimientos válidos al revés, así que el tablero
 * siempre tiene solución (revolver al azar puede dejarlo imposible).
 *
 * Fácil 3×3, medio 4×4, difícil 4×4 con menos tiempo.
 */
export default function Puzzle({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = ROMPECABEZAS[juego.rompecabezas];
  const enTiempo = useTemporizadores();

  const lado = dif.id === "facil" ? 3 : 4;
  const total = lado * lado;
  const totalSegundos = segundos(dif, juego.segundos || 150, 45);

  const lamina = useMemo(
    () => datos.laminas[azar(datos.laminas.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [piezas, setPiezas] = useState(() => revolverValido(lado, dif.id === "facil" ? 60 : 140));
  const [movimientos, setMovimientos] = useState(0);
  const [fase, setFase] = useState("jugando");

  const cerrado = useRef(false);

  const tiempo = useCronometro({
    activo: fase === "jugando",
    segundos: totalSegundos,
    alTerminar: () => terminar(false),
  });

  const resuelto = piezas.every((p, i) => p === i);

  function terminar(completado) {
    if (cerrado.current) return;
    cerrado.current = true;
    const acomodadas = piezas.filter((p, i) => p === i).length;
    onTerminar(
      construirResultado({
        puntos: completado ? 250 + Math.round(tiempo * 4) : acomodadas * 12,
        aciertos: completado ? total : acomodadas,
        total,
        dificultad: dif.id,
        vidasIniciales: 3,
        vidasRestantes: completado ? 3 : 1,
        completado,
        familia: juego.familia,
        resumen: completado
          ? `Armado en ${movimientos} movimientos.`
          : `Quedaron ${acomodadas} de ${total} piezas en su lugar.`,
      })
    );
  }

  function mover(indice) {
    if (fase !== "jugando") return;
    const vacio = piezas.indexOf(total - 1);
    if (!vecinos(indice, vacio, lado)) return;

    const nuevas = [...piezas];
    [nuevas[indice], nuevas[vacio]] = [nuevas[vacio], nuevas[indice]];
    setPiezas(nuevas);
    setMovimientos((m) => m + 1);
    sonido.clic();

    if (nuevas.every((p, i) => p === i)) {
      setFase("resuelto");
      sonido.victoria();
      confeti({ colores: personaje?.colores, cantidad: 110 });
      enTiempo(() => setFase("dato"), 700);
    }
  }

  if (!datos) return null;

  return (
    <div className="mini mini--puzzle">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        puntos={movimientos}
        onSalir={onSalir}
        extra={<span className="puzzle__movs">movimientos</span>}
      />

      <Cronometro tiempo={fase === "jugando" ? tiempo : 0} total={totalSegundos} />

      <p className="busca__pista">
        Arma la imagen de <strong>{lamina.nombre}</strong>. Toca una pieza pegada al hueco para
        deslizarla.
      </p>

      <div
        className="puzzle"
        style={{ "--lado": lado }}
        role="grid"
        aria-label={`Rompecabezas de ${lado} por ${lado}`}
      >
        {piezas.map((pieza, casilla) => {
          const esHueco = pieza === total - 1 && fase === "jugando";
          const fila = Math.floor(pieza / lado);
          const col = pieza % lado;
          return (
            <button
              key={casilla}
              className={`puzzle__pieza ${esHueco ? "puzzle__pieza--hueco" : ""} ${
                pieza === casilla ? "puzzle__pieza--ok" : ""
              }`}
              onClick={() => mover(casilla)}
              disabled={fase !== "jugando"}
              aria-label={esHueco ? "Hueco" : `Pieza ${pieza + 1}`}
              style={
                esHueco
                  ? undefined
                  : {
                      backgroundImage: `url(${lamina.imagen})`,
                      backgroundSize: `${lado * 100}% ${lado * 100}%`,
                      backgroundPosition: `${(col / (lado - 1)) * 100}% ${(fila / (lado - 1)) * 100}%`,
                    }
              }
            />
          );
        })}
      </div>

      {fase === "dato" ? (
        <div className="quiz__retro">
          <Retroalimentacion
            correcto
            explicacion={`¡Armado en ${movimientos} movimientos!`}
            dato={lamina.dato}
          />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={() => terminar(true)}>
              Ver recompensa →
            </button>
          </div>
        </div>
      ) : (
        !resuelto && (
          <div className="opciones">
            <button onClick={() => terminar(false)}>Rendirme y ver el resultado</button>
          </div>
        )
      )}
    </div>
  );
}

function vecinos(a, b, lado) {
  const fa = Math.floor(a / lado);
  const ca = a % lado;
  const fb = Math.floor(b / lado);
  const cb = b % lado;
  return Math.abs(fa - fb) + Math.abs(ca - cb) === 1;
}

/** Revuelve con movimientos válidos: así el tablero siempre tiene solución. */
function revolverValido(lado, pasos) {
  const total = lado * lado;
  const piezas = Array.from({ length: total }, (_, i) => i);
  let vacio = total - 1;

  for (let i = 0; i < pasos; i++) {
    const candidatos = [];
    for (let j = 0; j < total; j++) if (vecinos(j, vacio, lado)) candidatos.push(j);
    const elegido = candidatos[azar(candidatos.length)];
    [piezas[elegido], piezas[vacio]] = [piezas[vacio], piezas[elegido]];
    vacio = elegido;
  }

  // si de casualidad quedó resuelto, un movimiento más
  if (piezas.every((p, i) => p === i)) {
    const otro = vacio === 0 ? 1 : 0;
    if (vecinos(otro, vacio, lado)) {
      [piezas[otro], piezas[vacio]] = [piezas[vacio], piezas[otro]];
    }
  }
  return piezas;
}
