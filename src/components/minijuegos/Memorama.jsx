import { useState, useEffect, useRef } from "react";
import { MEMORAMA } from "../../data/personajes.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";

const PARES = 6;
const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

/** Construye las doce cartas del tablero según el grado. */
function armarTablero(personajeId, grado) {
  const fuente = MEMORAMA[personajeId];
  const cartas = [];

  if (grado === "secundaria") {
    revolver(fuente.conceptuales)
      .slice(0, PARES)
      .forEach((par, i) => {
        cartas.push({ id: `${i}a`, par: i, ...par.a, dato: par.dato });
        cartas.push({ id: `${i}b`, par: i, ...par.b, dato: par.dato });
      });
  } else {
    revolver(fuente.simples)
      .slice(0, PARES)
      .forEach((par, i) => {
        cartas.push({ id: `${i}a`, par: i, icono: par.icono, texto: par.texto, dato: par.dato });
        cartas.push({ id: `${i}b`, par: i, icono: par.icono, texto: par.texto, dato: par.dato });
      });
  }

  return revolver(cartas);
}

export default function Memorama({ personaje: p, grado, vidas: vidasIniciales, onTerminar }) {
  const segundosTotales = grado === "secundaria" ? 75 : 100;
  const castigo = 3; // segundos que cuesta cada par equivocado

  const [fase, setFase] = useState("instrucciones");
  const [cartas, setCartas] = useState([]);
  const [volteadas, setVolteadas] = useState([]);
  const [halladas, setHalladas] = useState([]);
  const [vidas, setVidas] = useState(vidasIniciales);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [tiempo, setTiempo] = useState(segundosTotales);
  const [dato, setDato] = useState(null);
  const [aviso, setAviso] = useState(null);

  const vidasRef = useRef(vidasIniciales);
  const puntosRef = useRef(0);
  const rachaRef = useRef(0);
  const halladasRef = useRef([]);
  const intentosRef = useRef(0);
  const bloqueado = useRef(false);
  const cerrado = useRef(false);

  useEffect(() => {
    if (fase !== "jugando") return;
    const id = setInterval(() => {
      setTiempo((t) => Math.max(0, +(t - 0.1).toFixed(1)));
    }, 100);
    return () => clearInterval(id);
  }, [fase]);

  useEffect(() => {
    if (fase !== "jugando") return;
    if (tiempo <= 0) sinTiempo();
    else if (tiempo <= 5 && Math.abs(tiempo % 1) < 0.05) sonido.tic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempo, fase]);

  function mostrarAviso(texto, tipo) {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 900);
  }

  function cerrar(exito) {
    if (cerrado.current) return;
    cerrado.current = true;
    onTerminar({
      puntos: puntosRef.current,
      vidasRestantes: Math.max(0, vidasRef.current),
      exito,
      resumen: exito
        ? `Encontró las ${PARES} parejas en ${intentosRef.current} intentos.`
        : `Se quedó sin tiempo con ${halladasRef.current.length} de ${PARES} parejas.`,
    });
  }

  function sinTiempo() {
    sonido.alarma();
    const quedan = vidasRef.current - 1;
    vidasRef.current = quedan;
    setVidas(quedan);

    if (quedan <= 0) {
      setFase("fin");
      setTimeout(() => cerrar(false), 900);
      return;
    }

    mostrarAviso("¡Se acabó el tiempo! Vas de nuevo", "mal");
    setTiempo(segundosTotales);
    setVolteadas([]);
  }

  function voltear(carta) {
    if (
      fase !== "jugando" ||
      bloqueado.current ||
      volteadas.some((c) => c.id === carta.id) ||
      halladas.includes(carta.par)
    )
      return;

    sonido.clic();
    const nuevas = [...volteadas, carta];
    setVolteadas(nuevas);

    if (nuevas.length < 2) return;

    bloqueado.current = true;
    intentosRef.current += 1;
    const [a, b] = nuevas;

    if (a.par === b.par) {
      rachaRef.current += 1;
      setRacha(rachaRef.current);
      const multiplicador = rachaRef.current >= 3 ? 2 : 1;
      const ganados = 20 * multiplicador;
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);

      halladasRef.current = [...halladasRef.current, a.par];
      setHalladas(halladasRef.current);
      setDato(a.dato);
      sonido.moneda();
      if (multiplicador > 1) sonido.combo(rachaRef.current);
      mostrarAviso(multiplicador > 1 ? `¡Racha x${rachaRef.current}! +${ganados}` : `+${ganados}`, "bien");

      setTimeout(() => {
        setVolteadas([]);
        bloqueado.current = false;

        if (halladasRef.current.length >= PARES) {
          const bono = Math.round(tiempo * 2);
          puntosRef.current += bono;
          setPuntos(puntosRef.current);
          confeti({ colores: p.colores, cantidad: 90 });
          sonido.bien();
          mostrarAviso(`¡Tablero limpio! +${bono} de bono`, "bien");
          setFase("fin");
          setTimeout(() => cerrar(true), 1300);
        }
      }, 550);
    } else {
      rachaRef.current = 0;
      setRacha(0);
      sonido.mal();
      setTiempo((t) => Math.max(0.1, +(t - castigo).toFixed(1)));
      mostrarAviso(`No eran pareja · −${castigo} s`, "mal");

      setTimeout(() => {
        setVolteadas([]);
        bloqueado.current = false;
      }, 850);
    }
  }

  if (fase === "instrucciones") {
    return (
      <div className="mini mini--intro">
        <img className="mini__figura flota" src={p.cuerpo} alt="" />
        <h2>{p.id === "sismo" ? "Memorama de emergencia" : "Memorama del terreno"}</h2>
        <p className="mini__texto">
          {grado === "secundaria"
            ? "Doce cartas, seis parejas. Aquí las cartas NO son iguales: hay que unir cada situación con lo que se debe hacer."
            : "Doce cartas, seis parejas. Voltea de dos en dos y encuentra las que son iguales."}
        </p>
        <p className="mini__texto mini__texto--chico">
          Tienes {segundosTotales} segundos. Cada par equivocado te cuesta {castigo} segundos, y
          el tiempo que sobre al final se convierte en puntos.
        </p>
        <button
          className="boton-grande"
          onClick={() => {
            sonido.despertar();
            sonido.clic();
            setCartas(armarTablero(p.id, grado));
            setFase("jugando");
          }}
        >
          ¡Empezar!
        </button>
      </div>
    );
  }

  const porcentaje = (tiempo / segundosTotales) * 100;

  return (
    <div className="mini mini--memorama">
      <div className="mini__hud">
        <span className="vidas" aria-label={`${Math.max(0, vidas)} vidas`}>
          {"❤️".repeat(Math.max(0, vidas))}
          {"🖤".repeat(Math.max(0, vidasIniciales - vidas))}
        </span>
        <span className="mini__ronda">
          {halladas.length} / {PARES} parejas
          {racha >= 2 && <strong className="racha"> 🔥 x{racha}</strong>}
        </span>
        <span className="marcador">{p.monedaIcono} {puntos}</span>
      </div>

      <div className="cronometro" aria-hidden="true">
        <div
          className={`cronometro__barra ${porcentaje < 25 ? "cronometro__barra--peligro" : ""}`}
          style={{ width: `${porcentaje}%` }}
        />
        <span className="cronometro__numero">{Math.ceil(tiempo)} s</span>
      </div>

      <div className="tablero">
        {cartas.map((carta) => {
          const abierta =
            volteadas.some((c) => c.id === carta.id) || halladas.includes(carta.par);
          const resuelta = halladas.includes(carta.par);
          return (
            <button
              key={carta.id}
              className={`memo ${abierta ? "memo--abierta" : ""} ${resuelta ? "memo--resuelta" : ""}`}
              onClick={() => voltear(carta)}
              aria-label={abierta ? carta.texto : "Carta tapada"}
            >
              <span className="memo__interior">
                <span className="memo__reverso" aria-hidden="true">
                  {p.monedaIcono}
                </span>
                <span className="memo__frente">
                  <span className="memo__icono" aria-hidden="true">{carta.icono}</span>
                  <span className="memo__texto">{carta.texto}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="memorama__dato">
        {dato ? <>🔎 {dato}</> : "Voltea dos cartas para empezar."}
      </p>

      {aviso && <div className={`aviso-flotante aviso-flotante--${aviso.tipo}`}>{aviso.texto}</div>}
    </div>
  );
}
