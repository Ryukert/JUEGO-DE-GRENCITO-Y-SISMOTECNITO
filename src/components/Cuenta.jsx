import { useState, useEffect, useRef } from "react";
import { PERSONAJES, GRADOS } from "../data/personajes.js";
import { entrarAlumno, salirAlumno, crearGrupo, entrarMaestro, leerMaestro } from "../lib/cuenta.js";
import Icono from "./Icono.jsx";
import Evaluacion from "./Evaluacion.jsx";

/**
 * «Mi grupo»: el alumno se une a su grupo (código + apodo + PIN) o vuelve a entrar,
 * y el maestro crea un grupo o abre su panel. No se pide ningún dato personal.
 */

const ESTADOS = {
  listo: "Todo guardado en tu grupo",
  guardando: "Guardando…",
  pendiente: "Guardando en un momento…",
  "sin-conexion": "Sin internet: se guarda aquí y se sube después",
};

function Campo({ id, etiqueta, ayuda, ...props }) {
  return (
    <label className="cuenta__campo" htmlFor={id}>
      <span>{etiqueta}</span>
      <input id={id} {...props} />
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

function Pestanas({ valor, opciones, onCambiar, etiqueta }) {
  return (
    <div className="cuenta__pestanas" role="tablist" aria-label={etiqueta}>
      {opciones.map(([id, texto]) => (
        <button key={id} type="button" role="tab" aria-selected={valor === id} className={valor === id ? "activa" : ""} onClick={() => onCambiar(id)}>
          {texto}
        </button>
      ))}
    </div>
  );
}

function FormAlumno({ onListo }) {
  const [modo, setModo] = useState("entrar");
  const [codigo, setCodigo] = useState("");
  const [apodo, setApodo] = useState("");
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState("sismo");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await entrarAlumno({ accion: modo, codigo, apodo, pin, avatar });
      onListo();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cuenta__form" onSubmit={enviar}>
      <Pestanas
        etiqueta="¿Ya tienes apodo?"
        valor={modo}
        onCambiar={(m) => { setModo(m); setError(""); }}
        opciones={[["entrar", "Ya tengo apodo"], ["registrar", "Es mi primera vez"]]}
      />
      <Campo
        id="cu-codigo" etiqueta="Código del grupo" ayuda="Te lo da tu maestro: 6 letras y números"
        value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        maxLength={7} autoComplete="off" autoCapitalize="characters" spellCheck={false} required
      />
      <Campo
        id="cu-apodo" etiqueta="Tu apodo" ayuda={modo === "registrar" ? "No pongas tu nombre completo" : null}
        value={apodo} onChange={(e) => setApodo(e.target.value)}
        maxLength={20} minLength={2} autoComplete="off" required
      />
      <Campo
        id="cu-pin" etiqueta={modo === "registrar" ? "Inventa un PIN de 4 números" : "Tu PIN"}
        ayuda={modo === "registrar" ? "No lo compartas. Si lo olvidas, tu maestro te pone otro." : null}
        value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" required
      />
      {modo === "registrar" && (
        <fieldset className="cuenta__avatares">
          <legend>Tu compañero</legend>
          {Object.values(PERSONAJES).map((p) => (
            <label key={p.id} className={avatar === p.id ? "elegido" : ""}>
              <input type="radio" name="avatar" value={p.id} checked={avatar === p.id} onChange={() => setAvatar(p.id)} />
              <img src={p.cara} alt="" width="48" height="48" />
              {p.nombre}
            </label>
          ))}
        </fieldset>
      )}
      {error && <p className="cuenta__error" role="alert">{error}</p>}
      <button className="boton-grande" type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : modo === "registrar" ? "Unirme al grupo" : "Entrar"}
      </button>
    </form>
  );
}

function FormMaestro({ onPanel }) {
  const yaDentro = leerMaestro();
  const [modo, setModo] = useState("entrar");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("primaria");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (modo === "crear" && clave !== clave2) return setError("Las dos claves no coinciden.");
    setEnviando(true);
    try {
      if (modo === "crear") await crearGrupo({ nombre, grado, clave });
      else await entrarMaestro({ codigo, clave });
      onPanel();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cuenta__form" onSubmit={enviar}>
      {yaDentro && (
        <button type="button" className="cuenta__panel" onClick={onPanel}>
          <Icono nombre="grupo" /> Abrir el panel de «{yaDentro.grupo.nombre}»
        </button>
      )}
      <Pestanas
        etiqueta="¿Ya tienes grupo?"
        valor={modo}
        onCambiar={(m) => { setModo(m); setError(""); }}
        opciones={[["entrar", "Ya tengo grupo"], ["crear", "Crear un grupo"]]}
      />
      {modo === "entrar" ? (
        <Campo
          id="cm-codigo" etiqueta="Código del grupo"
          value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          maxLength={7} autoComplete="off" spellCheck={false} required
        />
      ) : (
        <>
          <Campo
            id="cm-nombre" etiqueta="Nombre del grupo" ayuda="Por ejemplo «5° B, turno matutino»"
            value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} required
          />
          <fieldset className="cuenta__grados">
            <legend>Grado</legend>
            {Object.values(GRADOS).map((g) => (
              <label key={g.id} className={grado === g.id ? "elegido" : ""}>
                <input type="radio" name="grado" value={g.id} checked={grado === g.id} onChange={() => setGrado(g.id)} />
                {g.nombre}
              </label>
            ))}
          </fieldset>
        </>
      )}
      <Campo
        id="cm-clave" etiqueta={modo === "crear" ? "Clave del maestro" : "Clave"}
        ayuda={modo === "crear" ? "Mínimo 6 caracteres. Solo tú la sabes: con ella ves el avance del grupo." : null}
        value={clave} onChange={(e) => setClave(e.target.value)}
        type="password" minLength={6} maxLength={64} autoComplete={modo === "crear" ? "new-password" : "current-password"} required
      />
      {modo === "crear" && (
        <Campo
          id="cm-clave2" etiqueta="Repite la clave"
          value={clave2} onChange={(e) => setClave2(e.target.value)}
          type="password" minLength={6} maxLength={64} autoComplete="new-password" required
        />
      )}
      {error && <p className="cuenta__error" role="alert">{error}</p>}
      <button className="boton-grande" type="submit" disabled={enviando}>
        {enviando ? "Un momento…" : modo === "crear" ? "Crear el grupo" : "Abrir el panel"}
      </button>
    </form>
  );
}

export default function Cuenta({ cuenta, estado, onPanel, onCerrar }) {
  const [quien, setQuien] = useState("alumno");
  const [saliendo, setSaliendo] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const cerrarRef = useRef(null);

  useEffect(() => {
    cerrarRef.current?.focus();
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const p = cuenta ? PERSONAJES[cuenta.alumno.avatar] || PERSONAJES.sismo : null;

  return (
    <div className="ajustes-fondo" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="ajustes cuenta" role="dialog" aria-modal="true" aria-labelledby="cuenta-titulo">
        <header className="ajustes__cabeza">
          <h2 id="cuenta-titulo">
            <Icono nombre="grupo" /> {cuenta && evaluando ? "Evalúa a tu maestro" : "Mi grupo"}
          </h2>
          <button className="ajustes__cerrar" onClick={onCerrar} ref={cerrarRef} aria-label="Cerrar">
            <Icono nombre="mal" />
          </button>
        </header>

        {cuenta && evaluando ? (
          <Evaluacion onVolver={() => setEvaluando(false)} />
        ) : cuenta ? (
          <div className="cuenta__dentro">
            <img src={p.cara} alt="" width="72" height="72" />
            <p className="cuenta__apodo">{cuenta.alumno.apodo}</p>
            <p>
              Grupo <strong>{cuenta.grupo.nombre}</strong> · {GRADOS[cuenta.grupo.grado]?.nombre}
            </p>
            <p className={`cuenta__estado cuenta__estado--${estado}`} role="status">
              <Icono nombre="nube" /> {ESTADOS[estado] || ESTADOS.listo}
            </p>
            <p className="cuenta__nota">
              Tus récords, XP y medallas se guardan en tu grupo: puedes seguir en otra computadora o celular
              entrando con tu apodo y PIN.
            </p>
            <button className="boton-grande cuenta__evaluar" onClick={() => setEvaluando(true)}>
              <span aria-hidden="true">😡 😐 😄</span> Evaluar a mi maestro
            </button>
            <button
              className="cuenta__salir"
              disabled={saliendo}
              onClick={async () => {
                setSaliendo(true);
                await salirAlumno();
                setSaliendo(false);
              }}
            >
              {saliendo ? "Guardando…" : "Salir de mi cuenta en este equipo"}
            </button>
          </div>
        ) : (
          <>
            <Pestanas
              etiqueta="¿Quién eres?"
              valor={quien}
              onCambiar={setQuien}
              opciones={[["alumno", "Soy alumno"], ["maestro", "Soy maestro"]]}
            />
            {quien === "alumno" ? <FormAlumno onListo={onCerrar} /> : <FormMaestro onPanel={onPanel} />}
          </>
        )}
      </div>
    </div>
  );
}
