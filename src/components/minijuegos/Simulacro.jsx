import { useState, useEffect, useRef, useCallback } from "react";
import { ACCIONES_SIMULACRO, TRAMPAS_SIMULACRO } from "../../data/personajes.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";

const RONDAS = [
  { trampas: 1, segundos: 9 },
  { trampas: 2, segundos: 7 },
  { trampas: 3, segundos: 5.5 },
];

const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

export default function Simulacro({ personaje: p, vidas: vidasIniciales, onTerminar }) {
  const [fase, setFase] = useState("instrucciones");
  const [ronda, setRonda] = useState(0);
  const [paso, setPaso] = useState(0);
  const [tablero, setTablero] = useState([]);
  const [vidas, setVidas] = useState(vidasIniciales);
  const [puntos, setPuntos] = useState(0);
  const [tiempo, setTiempo] = useState(RONDAS[0].segundos);
  const [aviso, setAviso] = useState(null);

  // Los refs guardan la verdad del momento, sin depender del ciclo de render.
  const vidasRef = useRef(vidasIniciales);
  const puntosRef = useRef(0);
  const erroresRef = useRef(0);
  const cerrado = useRef(false);

  const config = RONDAS[Math.min(ronda, RONDAS.length - 1)];

  const armar = useCallback((indice) => {
    const cfg = RONDAS[Math.min(indice, RONDAS.length - 1)];
    const trampas = revolver(TRAMPAS_SIMULACRO).slice(0, cfg.trampas);
    setTablero(revolver([...ACCIONES_SIMULACRO, ...trampas]));
    setPaso(0);
    setTiempo(cfg.segundos);
  }, []);

  /* cronómetro */
  useEffect(() => {
    if (fase !== "jugando") return;
    const id = setInterval(() => {
      setTiempo((t) => Math.max(0, +(t - 0.1).toFixed(1)));
    }, 100);
    return () => clearInterval(id);
  }, [fase, ronda, paso]);

  /* reacciones al cronómetro, fuera del actualizador de estado */
  useEffect(() => {
    if (fase !== "jugando") return;
    if (tiempo <= 0) fallar("¡Se acabó el tiempo!");
    else if (tiempo <= 3 && Math.abs(tiempo % 1) < 0.05) sonido.tic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempo, fase]);

  function mostrarAviso(texto, tipo) {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 1000);
  }

  function cerrar(exito) {
    if (cerrado.current) return;
    cerrado.current = true;
    onTerminar({
      puntos: puntosRef.current,
      vidasRestantes: Math.max(0, vidasRef.current),
      exito,
      resumen: exito
        ? `Completó el simulacro con ${erroresRef.current} error${erroresRef.current === 1 ? "" : "es"}.`
        : "Se quedó sin vidas en el simulacro.",
    });
  }

  function fallar(motivo) {
    if (fase !== "jugando") return;
    sonido.mal();
    erroresRef.current += 1;
    const quedan = vidasRef.current - 1;
    vidasRef.current = quedan;
    setVidas(quedan);
    mostrarAviso(motivo, "mal");

    if (quedan <= 0) {
      setFase("fin");
      setTimeout(() => cerrar(false), 900);
    } else {
      armar(ronda);
    }
  }

  function tocar(item) {
    if (fase !== "jugando") return;
    const esperada = ACCIONES_SIMULACRO[paso];

    if (item.id !== esperada.id) {
      const esTrampa = TRAMPAS_SIMULACRO.some((t) => t.id === item.id);
      fallar(esTrampa ? "¡Eso es justo lo que NO se hace!" : "Ese no era el orden");
      return;
    }

    sonido.combo(paso + 1);
    const siguiente = paso + 1;

    if (siguiente < ACCIONES_SIMULACRO.length) {
      setPaso(siguiente);
      return;
    }

    const ganados = 25 + Math.round(tiempo * 3);
    puntosRef.current += ganados;
    setPuntos(puntosRef.current);
    confeti({ colores: p.colores, cantidad: 45 });
    sonido.bien();
    mostrarAviso(`¡Ronda superada! +${ganados}`, "bien");

    const nueva = ronda + 1;
    if (nueva >= RONDAS.length) {
      setFase("fin");
      setTimeout(() => cerrar(true), 1100);
    } else {
      setFase("pausa");
      setTimeout(() => {
        setRonda(nueva);
        armar(nueva);
        setFase("jugando");
        sonido.temblor();
      }, 1000);
    }
  }

  if (fase === "instrucciones") {
    return (
      <div className="mini mini--intro">
        <img className="mini__figura flota" src={p.cuerpo} alt="" />
        <h2>Simulacro relámpago</h2>
        <p className="mini__texto">
          Está temblando. Toca las tres acciones <strong>en este orden</strong>:
        </p>
        <ol className="mini__orden">
          {ACCIONES_SIMULACRO.map((a) => (
            <li key={a.id}>
              <span aria-hidden="true">{a.icono}</span> {a.texto}
            </li>
          ))}
        </ol>
        <p className="mini__texto mini__texto--chico">
          Aparecerán botones trampa. Si tocas uno, pierdes una vida.
        </p>
        <button
          className="boton-grande"
          onClick={() => {
            sonido.despertar();
            sonido.temblor();
            armar(0);
            setFase("jugando");
          }}
        >
          ¡Empezar!
        </button>
      </div>
    );
  }

  const porcentaje = (tiempo / config.segundos) * 100;

  return (
    <div className={`mini mini--simulacro ${fase === "jugando" ? "sacude" : ""}`}>
      <div className="mini__hud">
        <span className="vidas" aria-label={`${Math.max(0, vidas)} vidas`}>
          {"❤️".repeat(Math.max(0, vidas))}
          {"🖤".repeat(Math.max(0, vidasIniciales - vidas))}
        </span>
        <span className="mini__ronda">
          Ronda {Math.min(ronda + 1, RONDAS.length)} de {RONDAS.length}
        </span>
        <span className="marcador">{p.monedaIcono} {puntos}</span>
      </div>

      <div className="cronometro" aria-hidden="true">
        <div
          className={`cronometro__barra ${porcentaje < 35 ? "cronometro__barra--peligro" : ""}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="mini__pista">
        Ahora toca: <strong>{ACCIONES_SIMULACRO[paso].texto}</strong> ({paso + 1} de 3)
      </p>

      <div className="rejilla">
        {tablero.map((item) => (
          <button key={item.id} className="ficha" onClick={() => tocar(item)}>
            <span className="ficha__icono" aria-hidden="true">{item.icono}</span>
            <span>{item.texto}</span>
          </button>
        ))}
      </div>

      {aviso && <div className={`aviso-flotante aviso-flotante--${aviso.tipo}`}>{aviso.texto}</div>}
    </div>
  );
}
