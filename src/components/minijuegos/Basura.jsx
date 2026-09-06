import { useState, useEffect, useRef } from "react";
import { BOTES, RESIDUOS } from "../../data/personajes.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";

const TOTAL = 10;
const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

export default function Basura({ personaje: p, grado, vidas: vidasIniciales, onTerminar }) {
  const segundosPorPieza = grado === "secundaria" ? 3.5 : 5;

  const [fase, setFase] = useState("instrucciones");
  const [cola, setCola] = useState([]);
  const [indice, setIndice] = useState(0);
  const [vidas, setVidas] = useState(vidasIniciales);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [tiempo, setTiempo] = useState(segundosPorPieza);
  const [aviso, setAviso] = useState(null);

  const vidasRef = useRef(vidasIniciales);
  const puntosRef = useRef(0);
  const rachaRef = useRef(0);
  const aciertosRef = useRef(0);
  const bloqueado = useRef(false);
  const cerrado = useRef(false);

  const actual = cola[indice];

  /* al cambiar de residuo se reinicia el reloj */
  useEffect(() => {
    if (fase !== "jugando") return;
    bloqueado.current = false;
    setTiempo(segundosPorPieza);
  }, [indice, fase, segundosPorPieza]);

  useEffect(() => {
    if (fase !== "jugando") return;
    const id = setInterval(() => {
      setTiempo((t) => Math.max(0, +(t - 0.1).toFixed(1)));
    }, 100);
    return () => clearInterval(id);
  }, [fase, indice]);

  useEffect(() => {
    if (fase === "jugando" && tiempo <= 0 && !bloqueado.current) resolver(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempo, fase]);

  function mostrarAviso(texto, tipo) {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 850);
  }

  function cerrar(exito) {
    if (cerrado.current) return;
    cerrado.current = true;
    onTerminar({
      puntos: puntosRef.current,
      vidasRestantes: Math.max(0, vidasRef.current),
      exito,
      resumen: `Separó ${aciertosRef.current} de ${TOTAL} residuos correctamente.`,
    });
  }

  function resolver(boteId) {
    if (bloqueado.current || !actual) return;
    bloqueado.current = true;

    const correcto = boteId === actual.bote;

    if (correcto) {
      rachaRef.current += 1;
      aciertosRef.current += 1;
      setRacha(rachaRef.current);
      const multiplicador = rachaRef.current >= 3 ? 2 : 1;
      const ganados = (12 + Math.round(tiempo * 2)) * multiplicador;
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);
      sonido.moneda();
      if (multiplicador > 1) {
        sonido.combo(rachaRef.current);
        confeti({ colores: p.colores, cantidad: 30 });
      }
      mostrarAviso(
        multiplicador > 1 ? `¡Racha x${rachaRef.current}! +${ganados}` : `+${ganados}`,
        "bien"
      );
    } else {
      rachaRef.current = 0;
      setRacha(0);
      sonido.mal();
      vidasRef.current -= 1;
      setVidas(vidasRef.current);
      const nombreBote = BOTES.find((b) => b.id === actual.bote).nombre;
      mostrarAviso(boteId ? `Iba en ${nombreBote}` : "¡Se te fue el tiempo!", "mal");
    }

    setTimeout(() => {
      if (vidasRef.current <= 0) {
        setFase("fin");
        cerrar(false);
        return;
      }
      const siguiente = indice + 1;
      if (siguiente >= TOTAL) {
        setFase("fin");
        cerrar(true);
      } else {
        setIndice(siguiente);
      }
    }, 780);
  }

  if (fase === "instrucciones") {
    return (
      <div className="mini mini--intro">
        <img className="mini__figura flota" src={p.cuerpo} alt="" />
        <h2>Separa o pierde</h2>
        <p className="mini__texto">
          Llegan diez residuos, uno por uno. Mándalos al bote correcto antes de
          que se acabe su tiempo.
        </p>
        <div className="botes botes--muestra">
          {BOTES.map((b) => (
            <div key={b.id} className="bote" style={{ borderColor: b.color }}>
              <span className="bote__icono" aria-hidden="true">{b.icono}</span>
              <span>{b.nombre}</span>
            </div>
          ))}
        </div>
        <p className="mini__texto mini__texto--chico">
          Tres aciertos seguidos y tus puntos se multiplican por dos.
        </p>
        <button
          className="boton-grande"
          onClick={() => {
            sonido.despertar();
            sonido.clic();
            setCola(revolver(RESIDUOS).slice(0, TOTAL));
            setFase("jugando");
          }}
        >
          ¡Empezar!
        </button>
      </div>
    );
  }

  if (!actual) return null;

  const porcentaje = (tiempo / segundosPorPieza) * 100;

  return (
    <div className="mini mini--basura">
      <div className="mini__hud">
        <span className="vidas" aria-label={`${Math.max(0, vidas)} vidas`}>
          {"❤️".repeat(Math.max(0, vidas))}
          {"🖤".repeat(Math.max(0, vidasIniciales - vidas))}
        </span>
        <span className="mini__ronda">
          {indice + 1} / {TOTAL}
          {racha >= 2 && <strong className="racha"> 🔥 x{racha}</strong>}
        </span>
        <span className="marcador">{p.monedaIcono} {puntos}</span>
      </div>

      <div className="cronometro" aria-hidden="true">
        <div
          className={`cronometro__barra ${porcentaje < 35 ? "cronometro__barra--peligro" : ""}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="residuo" key={indice}>
        <span className="residuo__icono" aria-hidden="true">{actual.icono}</span>
        <span className="residuo__nombre">{actual.nombre}</span>
      </div>

      <div className="botes">
        {BOTES.map((b) => (
          <button
            key={b.id}
            className="bote bote--boton"
            style={{ borderColor: b.color }}
            onClick={() => resolver(b.id)}
          >
            <span className="bote__icono" aria-hidden="true">{b.icono}</span>
            <span>{b.nombre}</span>
          </button>
        ))}
      </div>

      {aviso && <div className={`aviso-flotante aviso-flotante--${aviso.tipo}`}>{aviso.texto}</div>}
    </div>
  );
}
