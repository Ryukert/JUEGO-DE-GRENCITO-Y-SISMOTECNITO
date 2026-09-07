import { useState, useMemo, useRef } from "react";
import { SOPAS } from "../../data/juegos/retos.js";
import { segundos, cuantos } from "../../lib/dificultad.js";
import { construirResultado } from "../../lib/recompensas.js";
import { useCronometro, useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Progreso, Aviso } from "../ui/Marco.jsx";

const LETRAS = "ABCDEFGHIJLMNOPRSTUVZ";
const azar = (n) => Math.floor(Math.random() * n);
const revolver = (l) => [...l].sort(() => Math.random() - 0.5);

/**
 * Sopa de letras generada al vuelo.
 *
 * El tablero se arma cada partida, así que no se puede memorizar. En
 * fácil las palabras van solo en horizontal y vertical; en difícil
 * también en diagonal y al revés.
 *
 * Se selecciona tocando la primera letra y luego la última: funciona
 * igual con dedo, ratón y teclado, sin arrastrar.
 */
export default function Sopa({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = SOPAS[juego.sopa];

  const lado = dif.id === "facil" ? 9 : dif.id === "medio" ? 11 : 13;
  const cuantasPalabras = cuantos(dif, juego.palabras || 5, 3, 7);
  const totalSegundos = segundos(dif, juego.segundos || 120, 40);
  const conDiagonales = dif.id !== "facil";
  const conReversa = dif.id === "dificil";

  const enTiempo = useTemporizadores();

  const { rejilla, colocadas, tema } = useMemo(
    () => armar(datos, lado, cuantasPalabras, conDiagonales, conReversa),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [halladas, setHalladas] = useState([]);
  const [inicio, setInicio] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [activo, setActivo] = useState(true);

  const puntosRef = useRef(0);
  const cerrado = useRef(false);

  const tiempo = useCronometro({
    activo,
    segundos: totalSegundos,
    alTerminar: () => cerrar(false),
  });

  const marcadas = useMemo(() => {
    const set = new Set();
    halladas.forEach((nombre) => {
      const p = colocadas.find((c) => c.palabra === nombre);
      p?.celdas.forEach(([f, c]) => set.add(`${f},${c}`));
    });
    return set;
  }, [halladas, colocadas]);

  function cerrar(completado) {
    if (cerrado.current) return;
    cerrado.current = true;
    setActivo(false);
    onTerminar(
      construirResultado({
        puntos: puntosRef.current + (completado ? Math.round(tiempo * 3) : 0),
        aciertos: halladas.length,
        total: colocadas.length,
        dificultad: dif.id,
        vidasIniciales: colocadas.length,
        vidasRestantes: halladas.length,
        completado,
        familia: juego.familia,
        resumen: `Encontró ${halladas.length} de ${colocadas.length} palabras.`,
      })
    );
  }

  function mostrarAviso(texto, tipo) {
    setAviso({ texto, tipo });
    enTiempo(() => setAviso(null), 1600);
  }

  function tocar(f, c) {
    if (!activo) return;
    if (!inicio) {
      sonido.clic();
      setInicio([f, c]);
      return;
    }
    const [f0, c0] = inicio;
    setInicio(null);
    if (f0 === f && c0 === c) return;

    const celdas = linea(f0, c0, f, c);
    if (!celdas) {
      sonido.mal();
      mostrarAviso("Las palabras van en línea recta", "mal");
      return;
    }

    const texto = celdas.map(([a, b]) => rejilla[a][b]).join("");
    const alReves = [...texto].reverse().join("");
    const encontrada = colocadas.find(
      (p) => (p.palabra === texto || p.palabra === alReves) && !halladas.includes(p.palabra)
    );

    if (!encontrada) {
      sonido.mal();
      mostrarAviso("Ahí no hay ninguna palabra", "mal");
      return;
    }

    puntosRef.current += 45;
    const nuevas = [...halladas, encontrada.palabra];
    setHalladas(nuevas);
    sonido.moneda();
    mostrarAviso(`${encontrada.palabra}: ${encontrada.dato}`, "bien");

    if (nuevas.length >= colocadas.length) {
      setActivo(false);
      confeti({ colores: personaje?.colores, cantidad: 100 });
      enTiempo(() => cerrar(true), 1500);
    }
  }

  if (!datos) return null;

  return (
    <div className="mini mini--sopa">
      <MarcoJuego juego={juego} dificultad={dif} puntos={puntosRef.current} onSalir={onSalir} />

      <Cronometro tiempo={tiempo} total={totalSegundos} />
      <Progreso
        hechos={halladas.length}
        total={colocadas.length}
        texto={`${halladas.length} / ${colocadas.length} · ${tema}`}
      />

      <div className="sopa" style={{ "--lado": lado }} role="grid" aria-label="Sopa de letras">
        {rejilla.map((fila, f) =>
          fila.map((letra, c) => {
            const marcada = marcadas.has(`${f},${c}`);
            const esInicio = inicio && inicio[0] === f && inicio[1] === c;
            return (
              <button
                key={`${f}-${c}`}
                className={`sopa__celda ${marcada ? "sopa__celda--ok" : ""} ${
                  esInicio ? "sopa__celda--inicio" : ""
                }`}
                onClick={() => tocar(f, c)}
                disabled={!activo}
                aria-label={`Letra ${letra}, fila ${f + 1}, columna ${c + 1}`}
              >
                {letra}
              </button>
            );
          })
        )}
      </div>

      <p className="sopa__ayuda">
        Toca la primera letra y luego la última. {conDiagonales ? "También hay diagonales." : ""}
      </p>

      <ul className="sopa__lista">
        {colocadas.map((p) => (
          <li key={p.palabra} className={halladas.includes(p.palabra) ? "sopa__hallada" : ""}>
            {p.palabra}
          </li>
        ))}
      </ul>

      <Aviso aviso={aviso} />
    </div>
  );
}

/* ---------------------------- generación ---------------------------- */

function linea(f0, c0, f1, c1) {
  const df = Math.sign(f1 - f0);
  const dc = Math.sign(c1 - c0);
  const largoF = Math.abs(f1 - f0);
  const largoC = Math.abs(c1 - c0);
  // solo horizontal, vertical o diagonal exacta
  if (largoF !== 0 && largoC !== 0 && largoF !== largoC) return null;
  const pasos = Math.max(largoF, largoC);
  return Array.from({ length: pasos + 1 }, (_, i) => [f0 + df * i, c0 + dc * i]);
}

function armar(datos, lado, cuantas, conDiagonales, conReversa) {
  const tema = datos.temas[azar(datos.temas.length)];
  const rejilla = Array.from({ length: lado }, () => Array(lado).fill(null));

  const direcciones = [
    [0, 1],
    [1, 0],
    ...(conDiagonales ? [[1, 1], [1, -1]] : []),
  ];

  const colocadas = [];

  revolver(tema.palabras)
    .filter((p) => p.palabra.length <= lado)
    .slice(0, cuantas)
    .forEach(({ palabra, dato }) => {
      const letras = conReversa && Math.random() < 0.4 ? [...palabra].reverse() : [...palabra];

      for (let intento = 0; intento < 250; intento++) {
        const [df, dc] = direcciones[azar(direcciones.length)];
        const f0 = azar(lado);
        const c0 = azar(lado);
        const fFin = f0 + df * (letras.length - 1);
        const cFin = c0 + dc * (letras.length - 1);
        if (fFin < 0 || fFin >= lado || cFin < 0 || cFin >= lado) continue;

        const celdas = letras.map((_, i) => [f0 + df * i, c0 + dc * i]);
        const choca = celdas.some(([f, c], i) => rejilla[f][c] && rejilla[f][c] !== letras[i]);
        if (choca) continue;

        celdas.forEach(([f, c], i) => {
          rejilla[f][c] = letras[i];
        });
        colocadas.push({ palabra, dato, celdas });
        return;
      }
    });

  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      if (!rejilla[f][c]) rejilla[f][c] = LETRAS[azar(LETRAS.length)];
    }
  }

  return { rejilla, colocadas, tema: tema.nombre };
}
