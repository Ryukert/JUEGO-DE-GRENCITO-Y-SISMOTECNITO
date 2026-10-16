import { useState, useEffect, useRef, useCallback } from "react";
import { PERSONAJES, GRADOS } from "./data/personajes.js";
import Portada from "./components/Portada.jsx";
import Juego from "./components/Juego.jsx";
import Final from "./components/Final.jsx";
import Tutorial from "./components/Tutorial.jsx";
import Ajustes from "./components/Ajustes.jsx";
import Centro from "./pages/Centro.jsx";
import Logros from "./pages/Logros.jsx";
import PantallaMinijuego from "./juegos/PantallaMinijuego.jsx";
import { POR_ID } from "./juegos/registro.js";
import { sonido, sonidoActivo, alternarSonido } from "./lib/sonido.js";
import { leerProgreso, guardarGrado, registrarPartida, borrarProgreso } from "./lib/progreso.js";
import { temaInicial, temaGuardado, guardarTema } from "./lib/tema.js";
import { leerPreferencias, guardarPreferencia, aplicarPreferencias } from "./lib/preferencias.js";
import { usarAtajos } from "./lib/atajos.js";

const TEMA_NEUTRO = {
  fondo: "#dbe9f8",
  fondo2: "#e8f3d6",
  tinta: "#10304f",
  acento: "#0f6fc4",
  acento2: "#c4500e",
  linea: "#8fb6dd",
  "acento-texto": "#0f6fc4",
  "acento2-texto": "#b0470c",
};

const TEMA_NEUTRO_OSCURO = {
  fondo: "#0b1828",
  fondo2: "#122318",
  tinta: "#e8f1fa",
  acento: "#0f6fc4",
  acento2: "#c4500e",
  linea: "#2f4c6b",
  "acento-texto": "#7cc0ff",
  "acento2-texto": "#ffa36b",
};

/* Pantalla a la que lleva el botón «atrás» del navegador o del teléfono. */
const ARRIBA = { minijuego: "centro", centro: "inicio", logros: "inicio", tutorial: "inicio", juego: "inicio", caido: "inicio", fin: "inicio" };

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
  const [minijuego, setMinijuego] = useState(null);
  const [tema, setTema] = useState(temaInicial);
  const [preferencias, setPreferencias] = useState(() => leerPreferencias());
  const [ajustes, setAjustes] = useState(false);
  const [origenLogros, setOrigenLogros] = useState("inicio");
  const [instalable, setInstalable] = useState(null);
  const reloj = useRef(null);

  const juegoLibre = minijuego ? POR_ID[minijuego] : null;
  const p = quien
    ? PERSONAJES[quien]
    : juegoLibre
      ? PERSONAJES[juegoLibre.personaje]
      : null;
  const mision = p ? p.misiones[Math.min(nivel, p.misiones.length - 1)] : null;

  const oscuro = tema === "oscuro";

  useEffect(() => {
    const t = p ? (oscuro ? p.temaOscuro : p.tema) : oscuro ? TEMA_NEUTRO_OSCURO : TEMA_NEUTRO;
    const raiz = document.documentElement;
    raiz.dataset.tema = tema;
    Object.entries(t).forEach(([k, v]) => raiz.style.setProperty(`--${k}`, v));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", oscuro ? t.fondo : t.acento);
  }, [p, tema, oscuro]);

  useEffect(() => aplicarPreferencias(), []);

  // sin elección guardada, el tema sigue al del sistema aunque cambie con la página abierta
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq?.addEventListener) return;
    const cambiar = (e) => { if (!temaGuardado()) setTema(e.matches ? "oscuro" : "claro"); };
    mq.addEventListener("change", cambiar);
    return () => mq.removeEventListener("change", cambiar);
  }, []);

  // «Instalar el juego»: el navegador avisa cuando se puede (Android, Chrome y Edge)
  useEffect(() => {
    const guardar = (e) => {
      e.preventDefault();
      setInstalable(e);
    };
    window.addEventListener("beforeinstallprompt", guardar);
    return () => window.removeEventListener("beforeinstallprompt", guardar);
  }, []);

  /* ---------- botón «atrás» del navegador y del teléfono ----------
     Fuera de la portada hay siempre una entrada nuestra en el historial.
     Al tocar «atrás» el navegador la quita, avisa (popstate) y el juego
     sube un nivel en vez de salirse de la página. */
  const estado = useRef({ pantalla, ajustes });
  estado.current = { pantalla, ajustes };
  const centinela = useRef(false);
  const ignorar = useRef(0);

  useEffect(() => {
    const fuera = pantalla !== "inicio" || ajustes;
    if (fuera && !centinela.current) {
      window.history.pushState({ escuadron: true }, "");
      centinela.current = true;
    } else if (!fuera && centinela.current) {
      // se volvió a la portada con un botón del juego: se quita la entrada sobrante
      centinela.current = false;
      ignorar.current += 1;
      window.history.back();
    }
  }, [pantalla, ajustes]);

  useEffect(() => {
    const alVolver = () => {
      if (ignorar.current > 0) {
        ignorar.current -= 1;
        return;
      }
      centinela.current = false;
      const { pantalla: actual, ajustes: abiertos } = estado.current;
      if (abiertos) return setAjustes(false);
      const destino = actual === "logros" ? origenRef.current : ARRIBA[actual];
      if (!destino) return;
      if (destino === "centro") alCentro();
      else alInicio();
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const origenRef = useRef(origenLogros);
  origenRef.current = origenLogros;

  usarAtajos(!ajustes);

  function alternarTema() {
    const nuevo = oscuro ? "claro" : "oscuro";
    guardarTema(nuevo);
    setTema(nuevo);
    sonido.clic();
  }

  function cambiarPreferencia(clave, valor) {
    setPreferencias(guardarPreferencia(clave, valor));
    sonido.clic();
  }

  useEffect(() => () => clearTimeout(reloj.current), []);

  const sacudir = useCallback(() => {
    setTemblor(true);
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setTemblor(false), 1200);
  }, []);

  function arrancar(id) {
    setPantalla("juego");
    if (id === "sismo") {
      sonido.temblor();
      sacudir();
    }
  }

  function iniciar(id, gradoElegido) {
    const g = gradoElegido || grado;
    setQuien(id);
    setMinijuego(null);
    setGrado(g);
    guardarGrado(g);
    setPreferencias(guardarPreferencia("ultimo", { personaje: id, grado: g }));
    setProgreso(leerProgreso());
    setNivel(0);
    setPuntos(0);
    setRacha(0);
    setVidas(GRADOS[g].vidas);
    setInsignias([]);
    // la primera vez, la explicación de 3 pasos antes de que corra el reloj
    if (!leerPreferencias().tutorialVisto) setPantalla("tutorial");
    else arrancar(id);
  }

  function terminarTutorial() {
    setPreferencias(guardarPreferencia("tutorialVisto", true));
    arrancar(quien);
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
    setMinijuego(null);
    setProgreso(leerProgreso());
  }

  function alCentro() {
    setQuien(null);
    setMinijuego(null);
    setProgreso(leerProgreso());
    setPantalla("centro");
    sonido.clic();
  }

  function abrirMinijuego(id) {
    setMinijuego(id);
    setPantalla("minijuego");
  }

  function abrirLogros() {
    setOrigenLogros(pantalla === "centro" ? "centro" : "inicio");
    setProgreso(leerProgreso());
    setPantalla("logros");
    sonido.clic();
  }

  function abrirAjustes() {
    sonido.clic();
    setAjustes(true);
  }

  const cerrarAjustes = useCallback(() => setAjustes(false), []);

  let vista;
  if (pantalla === "inicio") {
    vista = (
      <Portada
        progreso={progreso}
        ultimo={preferencias.ultimo}
        onElegir={iniciar}
        onCentro={alCentro}
        onLogros={abrirLogros}
        onAjustes={abrirAjustes}
        tema={tema}
        onTema={alternarTema}
      />
    );
  } else if (pantalla === "centro") {
    vista = (
      <Centro
        progreso={progreso}
        onJugar={abrirMinijuego}
        onSalir={alInicio}
        onLogros={abrirLogros}
        onAjustes={abrirAjustes}
        tema={tema}
        onTema={alternarTema}
      />
    );
  } else if (pantalla === "logros") {
    vista = <Logros progreso={progreso} onSalir={origenLogros === "centro" ? alCentro : alInicio} />;
  } else if (pantalla === "tutorial" && p) {
    vista = <Tutorial personaje={p} onFin={terminarTutorial} />;
  } else if (pantalla === "minijuego" && juegoLibre) {
    vista = (
      <PantallaMinijuego
        key={juegoLibre.id}
        juego={juegoLibre}
        personaje={PERSONAJES[juegoLibre.personaje]}
        grado={grado}
        progreso={progreso}
        onProgreso={setProgreso}
        onSalir={alCentro}
      />
    );
  } else if (pantalla === "caido") {
    vista = (
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
  } else if (pantalla === "fin") {
    vista = (
      <Final
        personaje={p}
        puntos={puntos}
        insignias={insignias}
        record={record}
        onRepetir={() => iniciar(quien, grado)}
        onOtro={() => iniciar(quien === "sismo" ? "green" : "sismo", grado)}
        onCentro={alCentro}
        onInicio={alInicio}
      />
    );
  } else {
    vista = (
      <Juego
        key={`${quien}-${nivel}`}
        personaje={p}
        grado={grado}
        mision={mision}
        nivel={nivel}
        puntos={puntos}
        vidas={vidas}
        racha={racha}
        record={progreso.records?.[quien] || 0}
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

  return (
    <>
      {vista}
      {ajustes && (
        <Ajustes
          sonidoOn={sonidoOn}
          onSonido={() => setSonidoOn(alternarSonido())}
          tema={tema}
          onTema={alternarTema}
          preferencias={preferencias}
          onPreferencia={cambiarPreferencia}
          onTutorial={() => {
            setPreferencias(guardarPreferencia("tutorialVisto", false));
            setAjustes(false);
          }}
          onBorrar={() => {
            borrarProgreso();
            setProgreso(leerProgreso());
            setPreferencias(guardarPreferencia("ultimo", null));
          }}
          instalar={
            instalable
              ? () => {
                  instalable.prompt();
                  setInstalable(null);
                }
              : null
          }
          onCerrar={cerrarAjustes}
        />
      )}
    </>
  );
}
