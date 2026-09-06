import { useState, useRef, useEffect, useCallback } from "react";
import { PERSONAJES, construirSistema } from "./data/personajes.js";
import Portada from "./components/Portada.jsx";
import Juego from "./components/Juego.jsx";
import Final from "./components/Final.jsx";

const TURNOS_MAX = 3;

export default function App() {
  const [pantalla, setPantalla] = useState("inicio");
  const [quien, setQuien] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [puntos, setPuntos] = useState(0);
  const [nivel, setNivel] = useState(0);
  const [turnos, setTurnos] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [temblor, setTemblor] = useState(false);
  const [insignias, setInsignias] = useState([]);
  const [sinConexion, setSinConexion] = useState(false);
  const temporizador = useRef(null);

  const p = quien ? PERSONAJES[quien] : null;
  const mision = p ? p.misiones[Math.min(nivel, p.misiones.length - 1)] : null;

  // Pinta el tema del personaje en el documento entero
  useEffect(() => {
    const t = p ? p.tema : { fondo: "#dbe9f8", fondo2: "#e8f3d6", tinta: "#10304f", acento: "#0f6fc4", acento2: "#f4691f", linea: "#8fb6dd" };
    const raiz = document.documentElement;
    Object.entries(t).forEach(([k, v]) => raiz.style.setProperty(`--${k}`, v));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t.acento);
  }, [p]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const sacudir = useCallback(() => {
    setTemblor(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setTemblor(false), 1300);
  }, []);

  function empezar(id) {
    const pj = PERSONAJES[id];
    setQuien(id);
    setPuntos(0);
    setNivel(0);
    setTurnos(0);
    setInsignias([]);
    setMensajes([
      {
        de: "bot",
        texto: `¡Hola! Soy ${pj.nombre}, ${pj.apodo}. Traigo tres misiones y necesito un compañero de equipo. ¿Le entramos a la primera?`,
      },
      { de: "bot", texto: pj.misiones[0].escenario },
    ]);
    setOpciones(pj.misiones[0].opciones.map((o) => o.texto));
    setPantalla("juego");
    if (id === "sismo") sacudir();
  }

  function avanzar(nivelActual) {
    const siguiente = nivelActual + 1;
    if (siguiente >= p.misiones.length) {
      setPantalla("fin");
      return;
    }
    const m = p.misiones[siguiente];
    setNivel(siguiente);
    setTurnos(0);
    setMensajes((prev) => [
      ...prev,
      { de: "sistema", texto: `Misión cumplida. Siguiente: ${m.titulo}` },
      { de: "bot", texto: m.escenario },
    ]);
    setOpciones(m.opciones.map((o) => o.texto));
    if (quien === "sismo") sacudir();
  }

  function respaldo(entrada) {
    const correcta = mision.opciones.find((o) => o.ok);
    const acerto =
      entrada.toLowerCase().includes(correcta.texto.toLowerCase().slice(0, 14)) ||
      correcta.texto.toLowerCase().includes(entrada.toLowerCase().slice(0, 14));
    return {
      reaccion: acerto ? "¡Esa es!" : "Casi, casi",
      correcto: acerto,
      mensaje: `${mision.explicacion} ${acerto ? "Lo tenías clarísimo." : "Ahora ya lo sabes para la próxima."}`,
      opciones: [],
      puntos: acerto ? 15 : 5,
      dato: mision.dato,
      misionCompleta: true,
    };
  }

  async function responder(entrada) {
    const texto = entrada.trim();
    if (!texto || cargando) return;

    const historial = [...mensajes, { de: "yo", texto }];
    setMensajes(historial);
    setOpciones([]);
    setCargando(true);

    let datos;
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: construirSistema(p, mision),
          messages: historial.map((m) => ({
            role: m.de === "yo" ? "user" : "assistant",
            content: m.texto,
          })),
        }),
      });
      if (!r.ok) throw new Error("respuesta no ok");
      const { texto: crudo } = await r.json();
      datos = JSON.parse(String(crudo).replace(/```json|```/g, "").trim());
      setSinConexion(false);
    } catch (e) {
      datos = respaldo(texto);
      setSinConexion(true);
    }

    const ganados = Math.max(0, Math.min(20, Number(datos.puntos) || 0));
    setPuntos((v) => v + ganados);
    setMensajes((m) => [
      ...m,
      {
        de: "bot",
        texto: datos.mensaje,
        reaccion: datos.reaccion,
        dato: datos.dato,
        ganados,
      },
    ]);

    const nuevoTurno = turnos + 1;
    setTurnos(nuevoTurno);
    setCargando(false);

    if (datos.misionCompleta || nuevoTurno >= TURNOS_MAX) {
      setInsignias((b) => [...b, mision.titulo]);
      const nivelActual = nivel;
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => avanzar(nivelActual), 950);
    } else {
      setOpciones(Array.isArray(datos.opciones) ? datos.opciones.slice(0, 3) : []);
    }
  }

  if (pantalla === "inicio") {
    return <Portada onElegir={empezar} />;
  }

  if (pantalla === "fin") {
    return (
      <Final
        personaje={p}
        puntos={puntos}
        insignias={insignias}
        onRepetir={() => empezar(quien === "sismo" ? "green" : "sismo")}
        onInicio={() => setPantalla("inicio")}
      />
    );
  }

  return (
    <Juego
      personaje={p}
      mision={mision}
      nivel={nivel}
      mensajes={mensajes}
      opciones={opciones}
      puntos={puntos}
      cargando={cargando}
      temblor={temblor}
      sinConexion={sinConexion}
      onResponder={responder}
      onSalir={() => setPantalla("inicio")}
    />
  );
}
