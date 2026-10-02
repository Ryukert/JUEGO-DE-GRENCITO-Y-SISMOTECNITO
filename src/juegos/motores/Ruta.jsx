import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { RUTAS, LECCIONES_RUTA } from "../../data/juegos/rutas.js";
import { segundos } from "../../lib/dificultad.js";
import { generarMapa, rutaSegura, voltear } from "../../lib/laberinto.js";
import { revolver } from "../../lib/azar.js";
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
  R: "🧱",
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

const PELIGROS = ["X", "T", "R"];

/** Elige el nivel según la dificultad y arma su mapa (al azar si toca). */
function prepararNivel(juego, dif) {
  const lista = RUTAS[juego.rutas] || [];
  const i = dif.id === "facil" ? 0 : dif.id === "medio" ? 1 : 2;
  let nivel = lista[Math.min(i, lista.length - 1)];
  if (Array.isArray(nivel)) nivel = nivel[Math.floor(Math.random() * nivel.length)];
  if (!nivel) return null;

  let mapa = nivel.generar ? generarMapa(nivel.generar) : nivel.mapa;
  if (nivel.voltear) mapa = voltear(mapa, Math.random() < 0.5, Math.random() < 0.5);
  return { ...nivel, mapa };
}

const lejania = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/**
 * Ruta de evacuación.
 *
 * El mapa viene de src/data/juegos/rutas.js como renglones de texto. El
 * jugador se mueve con flechas, WASD o la cruceta en pantalla, esquiva las
 * zonas de riesgo y llega a la salida segura. La dificultad elige el nivel:
 * en medio y difícil el laberinto es nuevo cada partida, hay réplicas que
 * tiran escombro y, en difícil, solo se ve lo que alumbra la linterna.
 *
 * Con `juego.peligrosBloquean` los peligros no se atraviesan: chocar cuesta
 * una vida y hay que rodearlos.
 */
export default function Ruta({ juego, personaje, dif, onTerminar, onSalir }) {
  const enTiempo = useTemporizadores();

  const [nivel] = useState(() => prepararNivel(juego, dif));
  const mapa = nivel?.mapa;

  const inicio = useMemo(() => {
    if (!mapa) return { x: 1, y: 1 };
    for (let y = 0; y < mapa.length; y++) {
      const x = mapa[y].indexOf("J");
      if (x >= 0) return { x, y };
    }
    return { x: 1, y: 1 };
  }, [mapa]);

  // Con segundosPorPaso el tiempo depende del largo real de la ruta segura:
  // un laberinto corto no regala segundos y uno largo no es imposible.
  const totalSegundos = useMemo(() => {
    if (nivel?.segundosPorPaso) {
      const ruta = rutaSegura(mapa, inicio);
      const pasos = ruta ? ruta.length - 1 : 30;
      return segundos(dif, pasos * nivel.segundosPorPaso, 15);
    }
    return segundos(dif, nivel?.segundos || 50, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivel]);

  // Algunos mapas (polinizadores) exigen recoger todo antes de llegar a la
  // meta. El resto solo pide llegar a la salida.
  const iconos = { ...ICONOS, ...(juego.iconos || {}) };
  const porRecoger = useMemo(() => {
    if (!mapa || !juego.recolectarTodo) return 0;
    return mapa.join("").split("E").length - 1;
  }, [mapa, juego.recolectarTodo]);

  const [pos, setPos] = useState(inicio);
  const [vidas, setVidas] = useState(dif.vidas);
  const [puntos, setPuntos] = useState(0);
  const [recogidos, setRecogidos] = useState([]);
  const [visitados, setVisitados] = useState([]);
  const [escombros, setEscombros] = useState([]);
  const [temblando, setTemblando] = useState(false);
  const [castigado, setCastigado] = useState(0); // segundos perdidos por choques
  const [retro, setRetro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [activo, setActivo] = useState(true);

  const puntosRef = useRef(0);
  const vidasRef = useRef(dif.vidas);
  const pasosRef = useRef(0);
  const erroresRef = useRef(0);
  const cerrado = useRef(false);
  const tiempoRef = useRef(totalSegundos);
  const escombrosRef = useRef([]);
  const replicasRef = useRef(0);

  /* Casillas que ya alumbró la linterna: se quedan visibles, pero tenues. */
  const vistasRef = useRef(null);
  function alumbrar(p) {
    const r = nivel?.vision;
    if (!r) return;
    for (let y = p.y - r; y <= p.y + r; y++)
      for (let x = p.x - r; x <= p.x + r; x++) vistasRef.current.add(`${x},${y}`);
  }
  if (!vistasRef.current) {
    vistasRef.current = new Set();
    alumbrar(inicio);
  }

  const tiempo = useCronometro({
    activo: activo && !retro,
    segundos: totalSegundos,
    alTerminar: () => cerrar(false),
  });
  const restante = Math.max(0, +(tiempo - castigado).toFixed(1));
  tiempoRef.current = restante;

  // los choques también se comen el reloj: se acaba antes que el cronómetro
  useEffect(() => {
    if (castigado > 0 && restante <= 0 && activo) cerrar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restante]);

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

  const celdaEn = (x, y) => (escombrosRef.current.includes(`${x},${y}`) ? "R" : mapa[y]?.[x]);

  /* Réplica: tiembla, y cae escombro en casillas libres sin cerrar nunca
     el último camino seguro hasta la salida. */
  function lanzarReplica({ cuantas = 1, enRuta = false }) {
    setTemblando(true);
    sonido.temblor();
    enTiempo(() => setTemblando(false), 1200);

    const yo = posRef.current;
    const tapadas = new Set(escombrosRef.current);
    const libre = (c) => mapa[c.y][c.x] === "." && !tapadas.has(`${c.x},${c.y}`) && lejania(c, yo) > 1;

    const ruta = rutaSegura(mapa, yo, tapadas) || [];
    const enCamino = new Set(ruta.map((c) => `${c.x},${c.y}`));
    const resto = [];
    mapa.forEach((fila, y) =>
      [...fila].forEach((_, x) => {
        if (!enCamino.has(`${x},${y}`) && libre({ x, y })) resto.push({ x, y });
      })
    );

    let caidos = 0;
    const intentar = (lista, maximo) => {
      for (const c of lista) {
        if (caidos >= maximo) return;
        if (!libre(c)) continue;
        const llave = `${c.x},${c.y}`;
        tapadas.add(llave);
        if (rutaSegura(mapa, yo, tapadas)) caidos++;
        else tapadas.delete(llave);
      }
    };
    if (enRuta) intentar(revolver(ruta.slice(2, -1)), 1);
    intentar(revolver(resto), cuantas);

    escombrosRef.current = [...tapadas];
    setEscombros(escombrosRef.current);
    mostrarAviso(caidos ? "¡Réplica! Cayó escombro 🧱" : "¡Réplica!", "mal");
  }

  useEffect(() => {
    const replicas = nivel?.replicas;
    if (!replicas || !activo || retro || cerrado.current) return;
    const toca = Math.floor((totalSegundos - tiempo) / replicas.cada);
    if (toca <= replicasRef.current) return;
    replicasRef.current = toca;
    lanzarReplica(replicas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempo]);

  /* Chocar con un peligro: cuesta una vida (y segundos, si el nivel lo
     pide) y explica por qué. */
  function golpe(celda, llave) {
    erroresRef.current += 1;
    vidasRef.current -= 1;
    setVidas(vidasRef.current);
    setVisitados((v) => [...v, llave]);
    sonido.mal();
    if (nivel.castigo) {
      setCastigado((c) => c + nivel.castigo);
      mostrarAviso(`⏱️ −${nivel.castigo} s`, "mal");
    }

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

  const mover = useCallback(
    (dx, dy) => {
      if (!activo || retro || !mapa || cerrado.current) return;

      const p = posRef.current;
      const nx = p.x + dx;
      const ny = p.y + dy;
      const celda = celdaEn(nx, ny);
      if (!celda || celda === "#") {
        sonido.tic();
        return;
      }
      const llave = `${nx},${ny}`;
      const peligro = PELIGROS.includes(celda);

      // el peligro tapa el paso: no se avanza, solo se paga el choque una vez
      if (peligro && juego.peligrosBloquean) {
        if (visitados.includes(llave)) sonido.tic();
        else golpe(celda, llave);
        return;
      }

      posRef.current = { x: nx, y: ny };
      setPos(posRef.current);
      alumbrar(posRef.current);
      pasosRef.current += 1;

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

      if (peligro && !visitados.includes(llave)) golpe(celda, llave);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activo, retro, mapa, recogidos, visitados, porRecoger]
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

  const columnas = mapa[0].length;
  const filas = mapa.length;
  const vision = nivel.vision;

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

      <Cronometro tiempo={restante} total={totalSegundos} />

      <p className="busca__pista">
        <strong>{nivel.titulo}.</strong> {nivel.pista}
        {juego.recolectarTodo && (
          <b className="ruta__contador">
            {" "}
            {iconos.E} {recogidos.length}/{porRecoger}
          </b>
        )}
      </p>

      <div className={`tablero-zona ${temblando ? "tiembla" : ""}`}>
        <div
          className={`mapa tablero-ajustable ${vision ? "mapa--oscuro" : ""}`}
          style={{ "--columnas": columnas, "--filas": filas }}
          role="img"
          aria-label={`Mapa de evacuación, estás en la fila ${pos.y}, columna ${pos.x}`}
        >
        {mapa.map((fila, y) =>
          [...fila].map((_, x) => {
            const llave = `${x},${y}`;
            const celda = escombros.includes(llave) ? "R" : fila[x];
            const golpeado = visitados.includes(llave);
            const usado = recogidos.includes(llave) || (golpeado && !juego.peligrosBloquean);
            const aqui = pos.x === x && pos.y === y;

            // fuera del alcance de la linterna: oscuro, salvo lo ya visto y
            // la salida, que es fotoluminiscente
            const lejos = vision && lejania({ x, y }, pos) > vision;
            const oculta = lejos && celda !== "S" && !vistasRef.current.has(llave);
            const base = oculta ? "oscura" : celda === "#" ? "muro" : "piso";
            const extra = [
              aqui && "celda--yo",
              lejos && !oculta && (celda === "S" ? "celda--luz" : "celda--recuerdo"),
              golpeado && !usado && "celda--golpe",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <span key={llave} className={`celda celda--${base} ${extra}`}>
                {aqui ? (
                  <span className="celda__yo" aria-hidden="true">
                    🧍
                  </span>
                ) : usado || oculta ? (
                  ""
                ) : celda === "R" ? (
                  <span className="celda__escombro">{iconos.R}</span>
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
          {vision ? "🔦" : "🧭"}
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
