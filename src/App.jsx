import { useState, useEffect, useRef, useCallback } from "react";
import { PERSONAJES, GRADOS } from "./data/personajes.js";
import Portada from "./components/Portada.jsx";
import Juego from "./components/Juego.jsx";
import Final from "./components/Final.jsx";
import { sonido, sonidoActivo, alternarSonido } from "./lib/sonido.js";
import { leerProgreso, guardarGrado, registrarPartida } from "./lib/progreso.js";

const TEMA_NEUTRO = {
  fondo: "#dbe9f8",
  fondo2: "#e8f3d6",
  tinta: "#10304f",
  acento: "#0f6fc4",
  acento2: "#f4691f",
  linea: "#8fb6dd",
};

export default function App() {
  const [progreso, setProgreso] = useState(() => leerProgreso());
  const [pantalla, setPantalla] = useState("inicio");
  const [quien, setQuien] = useState(null);
  const [grado, setGrado] = useState(progreso.grado || "primaria");
  const [nivel, setNivel] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [racha, setRacha] = useState(0);
  const [insignias, setInsignias] = useState([]);
  const [temblor, setTemblor] = useState(false);
  const [sonidoOn, setSonidoOn] = useState(sonidoActivo());
  const [record, setRecord] = useState({ nuevoRecord: false, recordAnterior: 0 });
  const reloj = useRef(null);

  const p = quien ? PERSONAJES[quien] : null;
  const mision = p ? p.misiones[Math.min(nivel, p.misiones.length - 1)] : null;

  useEffect(() => {
    const t = p ? p.tema : TEMA_NEUTRO;
    const raiz = document.documentElement;
    Object.entries(t).forEach(([k, v]) => raiz.style.setProperty(`--${k}`, v));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t.acento);
  }, [p]);

  useEffect(() => () => clearTimeout(reloj.current), []);

  const sacudir = useCallback(() => {
    setTemblor(true);
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setTemblor(false), 1200);
  }, []);

  function iniciar(id, gradoElegido) {
    const g = gradoElegido || grado;
    setQuien(id);
    setGrado(g);
    guardarGrado(g);
    setProgreso(leerProgreso());
    setNivel(0);
    setPuntos(0);
    setRacha(0);
    setVidas(GRADOS[g].vidas);
    setInsignias([]);
    setPantalla("juego");
    if (id === "sismo") {
      sonido.temblor();
      sacudir();
    }
  }

  function sumarPuntos(n) {
    setPuntos((v) => v + n);
    setRacha((r) => r + 1);
  }

  function fallar() {
    setRacha(0);
    const quedan = vidas - 1;
    setVidas(Math.max(0, quedan));
    if (quedan <= 0) {
      sonido.alarma();
      setTimeout(() => setPantalla("caido"), 1400);
    }
  }

  function terminarMision(resultado = {}) {
    if (typeof resultado.puntos === "number") setPuntos((v) => v + resultado.puntos);
    if (typeof resultado.vidasRestantes === "number") setVidas(resultado.vidasRestantes);

    if (resultado.exito === false) {
      setPantalla("caido");
      return;
    }

    setInsignias((b) => [...b, mision.titulo]);

    const siguiente = nivel + 1;
    if (siguiente >= p.misiones.length) {
      const totalFinal = puntos + (resultado.puntos || 0);
      const r = registrarPartida({
        personaje: p.id,
        puntos: totalFinal,
        insignias: [...insignias, mision.titulo],
      });
      setRecord(r);
      setProgreso(leerProgreso());
      setPantalla("fin");
      return;
    }

    setNivel(siguiente);
    if (p.misiones[siguiente].tipo === "minijuego" || quien === "sismo") sacudir();
  }

  function reintentar() {
    setVidas(GRADOS[grado].vidas);
    setRacha(0);
    setPantalla("juego");
    sonido.clic();
  }

  function alInicio() {
    setPantalla("inicio");
    setQuien(null);
    setProgreso(leerProgreso());
  }

  if (pantalla === "inicio") {
    return <Portada progreso={progreso} onElegir={iniciar} />;
  }

  if (pantalla === "caido") {
    return (
      <div className="pantalla final final--caido">
        <img className="final__figura" src={p.cuerpo} alt="" />
        <h2>Se acabaron las vidas</h2>
        <p className="final__record">
          Llevas {puntos} {p.moneda}. Nadie aprende a la primera: repite esta
          misión con las tres vidas otra vez.
        </p>
        <div className="opciones opciones--centro">
          <button className="boton-grande" onClick={reintentar}>Reintentar la misión</button>
          <button onClick={alInicio}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  if (pantalla === "fin") {
    return (
      <Final
        personaje={p}
        puntos={puntos}
        insignias={insignias}
        record={record}
        onRepetir={() => iniciar(quien, grado)}
        onOtro={() => iniciar(quien === "sismo" ? "green" : "sismo", grado)}
        onInicio={alInicio}
      />
    );
  }

  return (
    <Juego
      key={`${quien}-${nivel}`}
      personaje={p}
      grado={grado}
      mision={mision}
      nivel={nivel}
      puntos={puntos}
      vidas={vidas}
      racha={racha}
      temblor={temblor}
      sonidoOn={sonidoOn}
      onSonido={() => setSonidoOn(alternarSonido())}
      onPuntos={sumarPuntos}
      onFallo={fallar}
      onFinMision={terminarMision}
      onSalir={alInicio}
    />
  );
}
