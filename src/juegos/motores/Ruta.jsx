import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { RUTAS, LECCIONES_RUTA } from "../../data/juegos/rutas.js";
import { segundos } from "../../lib/dificultad.js";
import { construirResultado } from "../../lib/recompensas.js";
import { useCronometro, useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Retroalimentacion, Aviso } from "../ui/Marco.jsx";

const ICONOS = {
  "#": "",
  ".": "",
  S: "🟢",
  X: "⚠️",
  T: "🛗",
  E: "🧯",
  P: "🪧",
};

const TECLAS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  W: [0, -1],
  S: [0, 1],
  A: [-1, 0],
  D: [1, 0],
};

/**
 * Ruta de evacuación.
 *
 * El mapa viene de src/data/juegos/rutas.js como renglones de texto. El
 * jugador se mueve con flechas, WASD o la cruceta en pantalla, esquiva las
 * zonas de riesgo y llega a la salida segura. La dificultad elige el mapa
 * (más grande y enredado) y recorta el tiempo.
 */
export default function Ruta({ juego, personaje, dif, onTerminar, onSalir }) {
  const enTiempo = useTemporizadores();

  const nivel = useMemo(() => {
    const lista = RUTAS[juego.rutas] || [];
    const i = dif.id === "facil" ? 0 : dif.id === "medio" ? 1 : 2;
    return lista[Math.min(i, lista.length - 1)] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inicio = useMemo(() => {
    if (!nivel) return { x: 1, y: 1 };
    for (let y = 0; y < nivel.mapa.length; y++) {
      const x = nivel.mapa[y].indexOf("J");
      if (x >= 0) return { x, y };
    }
    return { x: 1, y: 1 };
  }, [nivel]);

  const totalSegundos = segundos(dif, nivel?.segundos || 50, 15);

  // Algunos mapas (polinizadores) exigen recoger todo antes de llegar a la
  // meta. El resto solo pide llegar a la salida.
  const iconos = { ...ICONOS, ...(juego.iconos || {}) };
  const porRecoger = useMemo(() => {
    if (!nivel || !juego.recolectarTodo) return 0;
    return nivel.mapa.join("").split("E").length - 1;
  }, [nivel, juego.recolectarTodo]);

  const [pos, setPos] = useState(inicio);
  const [vidas, setVidas] = useState(dif.vidas);
  const [puntos, setPuntos] = useState(0);
  const [recogidos, setRecogidos] = useState([]);
  const [visitados, setVisitados] = useState([]);
  const [retro, setRetro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [activo, setActivo] = useState(true);

  const puntosRef = useRef(0);
  const vidasRef = useRef(dif.vidas);
  const pasosRef = useRef(0);
  const erroresRef = useRef(0);
  const cerrado = useRef(false);
  const tiempoRef = useRef(totalSegundos);

  const tiempo = useCronometro({
    activo: activo && !retro,
    segundos: totalSegundos,
    alTerminar: () => cerrar(false),
  });
  tiempoRef.current = tiempo;

  const cerrar = useCallback(
    (completado) => {
      if (cerrado.current) return;
      cerrado.current = true;
      setActivo(false);
      onTerminar(
        construirResultado({
          puntos: puntosRef.current,
          aciertos: Math.max(0, pasosRef.current - erroresRef.current),
          total: Math.max(1, pasosRef.current),
          dificultad: dif.id,
          vidasIniciales: dif.vidas,
          vidasRestantes: vidasRef.current,
          completado,
          familia: juego.familia,
          resumen: completado
            ? `Llegó a la salida con ${erroresRef.current} error${erroresRef.current === 1 ? "" : "es"}.`
            : "No alcanzó la salida segura.",
        })
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function mostrarAviso(texto, tipo) {
    setAviso({ texto, tipo });
    enTiempo(() => setAviso(null), 900);
  }

  /* La posición vive también en un ref para no calcular dentro del
     actualizador de estado: ahí los efectos se duplicarían en StrictMode. */
  const posRef = useRef(inicio);

  const mover = useCallback(
    (dx, dy) => {
      if (!activo || retro || !nivel || cerrado.current) return;

      const p = posRef.current;
      const nx = p.x + dx;
      const ny = p.y + dy;
      const fila = nivel.mapa[ny];
      if (!fila) return;
      const celda = fila[nx];
      if (!celda || celda === "#") {
        sonido.tic();
        return;
      }

      posRef.current = { x: nx, y: ny };
      setPos(posRef.current);
      pasosRef.current += 1;
      const llave = `${nx},${ny}`;

      if (celda === "S") {
        if (juego.recolectarTodo && recogidos.length < porRecoger) {
          sonido.tic();
          mostrarAviso(`Todavía te faltan ${porRecoger - recogidos.length}`, "mal");
          return;
        }
        const bono = 60 + Math.round(tiempoRef.current * 4);
        puntosRef.current += bono;
        setPuntos(puntosRef.current);
        setActivo(false);
        sonido.victoria();
        confeti({ colores: personaje?.colores, cantidad: 110 });
        enTiempo(() => cerrar(true), 800);
        return;
      }

      if ((celda === "E" || celda === "P") && !recogidos.includes(llave)) {
        const gana = celda === "E" ? 35 : 25;
        puntosRef.current += gana;
        setPuntos(puntosRef.current);
        setRecogidos((r) => [...r, llave]);
        sonido.moneda();
        mostrarAviso(`${iconos[celda]} +${gana}`, "bien");
        return;
      }

      if ((celda === "X" || celda === "T") && !visitados.includes(llave)) {
        erroresRef.current += 1;
        vidasRef.current -= 1;
        setVidas(vidasRef.current);
        setVisitados((v) => [...v, llave]);
        sonido.mal();

        const opciones = LECCIONES_RUTA[celda] || [];
        const leccion = opciones[Math.floor(Math.random() * opciones.length)];

        if (vidasRef.current <= 0) {
          setActivo(false);
          enTiempo(() => cerrar(false), 900);
          mostrarAviso("Se acabaron las vidas", "mal");
        } else if (leccion) {
          setRetro(leccion);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activo, retro, nivel, recogidos, visitados, porRecoger]
  );

  /* teclado: se quita solo al desmontar */
  useEffect(() => {
    function alTeclear(e) {
      const dir = TECLAS[e.key];
      if (!dir) return;
      e.preventDefault();
      mover(dir[0], dir[1]);
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [mover]);

  if (!nivel) return null;

  const columnas = nivel.mapa[0].length;
  const filas = nivel.mapa.length;

  return (
    <div className="mini mini--ruta">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        vidas={vidas}
        vidasMax={dif.vidas}
        puntos={puntos}
        onSalir={onSalir}
      />

      <Cronometro tiempo={tiempo} total={totalSegundos} />

      <p className="busca__pista">
        <strong>{nivel.titulo}.</strong> {nivel.pista}
        {juego.recolectarTodo && (
          <b className="ruta__contador">
            {" "}
            {iconos.E} {recogidos.length}/{porRecoger}
          </b>
        )}
      </p>

      <div className="tablero-zona">
        <div
          className="mapa tablero-ajustable"
          style={{ "--columnas": columnas, "--filas": filas }}
          role="img"
          aria-label={`Mapa de evacuación, estás en la fila ${pos.y}, columna ${pos.x}`}
        >
        {nivel.mapa.map((fila, y) =>
          [...fila].map((celda, x) => {
            const llave = `${x},${y}`;
            const usado = recogidos.includes(llave) || visitados.includes(llave);
            const aqui = pos.x === x && pos.y === y;
            const base = celda === "#" ? "muro" : "piso";
            return (
              <span key={llave} className={`celda celda--${base} ${aqui ? "celda--yo" : ""}`}>
                {aqui ? (
                  <span className="celda__yo" aria-hidden="true">
                    🧍
                  </span>
                ) : usado ? (
                  ""
                ) : (
                  iconos[celda] || ""
                )}
              </span>
            );
          })
          )}
        </div>
      </div>

      <div className="cruceta" aria-hidden={false}>
        <button className="cruceta__btn cruceta__arriba" onClick={() => mover(0, -1)} aria-label="Arriba">
          ▲
        </button>
        <button className="cruceta__btn cruceta__izq" onClick={() => mover(-1, 0)} aria-label="Izquierda">
          ◀
        </button>
        <button className="cruceta__btn cruceta__der" onClick={() => mover(1, 0)} aria-label="Derecha">
          ▶
        </button>
        <button className="cruceta__btn cruceta__abajo" onClick={() => mover(0, 1)} aria-label="Abajo">
          ▼
        </button>
        <span className="cruceta__centro" aria-hidden="true">
          🧭
        </span>
      </div>

      {retro && (
        <div className="busca__retro">
          <Retroalimentacion
            correcto={false}
            respuestaCorrecta={retro.titulo}
            explicacion={retro.texto}
            dato={retro.dato}
          />
          <div className="opciones">
            <button
              className="boton-grande"
              autoFocus
              onClick={() => {
                sonido.clic();
                setRetro(null);
              }}
            >
              Seguir →
            </button>
          </div>
        </div>
      )}

      <Aviso aviso={aviso} />
    </div>
  );
}
