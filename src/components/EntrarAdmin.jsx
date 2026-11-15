import { useState, useEffect } from "react";
import Icono from "./Icono.jsx";
import { esCorreoInstitucional, dominiosEnTexto, DOMINIOS_INSTITUCIONALES } from "../data/institucion.js";

/**
 * Entrar a la administración de encuestas. Cualquiera con correo institucional crea su cuenta;
 * entra después de confirmar su correo. Modos:
 *   entrar · crear · recuperar («¿Olvidaste tu contraseña?») · nueva (desde el enlace del correo)
 *   · clave (respaldo: EDITORES_CLAVE).
 *
 * Los enlaces de los correos de Supabase regresan a /admin con datos después de «#»:
 *   type=recovery&access_token=…  → pide la contraseña nueva
 *   type=signup                    → «tu correo quedó confirmado»
 *   error_description=…            → el enlace venció o ya se usó
 * Se leen una vez y se borran de la barra de direcciones.
 */
export const MINIMO = 8;

/** Lo que trae el enlace de un correo de Supabase (después de «#»). */
export function leerEnlace(hash = typeof location !== "undefined" ? location.hash : "") {
  const p = new URLSearchParams(String(hash).replace(/^#/, ""));
  if (p.get("error") || p.get("error_description")) return { tipo: "error" };
  if (p.get("type") === "recovery" && p.get("access_token")) return { tipo: "nueva", token: p.get("access_token") };
  if (["signup", "email", "email_change"].includes(p.get("type"))) return { tipo: "confirmado" };
  return null;
}

const TITULOS = {
  entrar: "Entra con tu cuenta institucional.",
  crear: "Crea tu cuenta con tu correo institucional. Te mandaremos un correo para confirmarla.",
  recuperar: "Escribe tu correo y te mandaremos un enlace para poner una contraseña nueva.",
  nueva: "Escribe tu contraseña nueva.",
  clave: "Escribe la clave de administración.",
};
const BOTONES = { entrar: "Entrar", crear: "Crear mi cuenta", recuperar: "Mandarme el enlace", nueva: "Guardar la contraseña", clave: "Entrar" };

export default function EntrarAdmin({ onEntrar }) {
  const [enlace] = useState(() => leerEnlace());
  const [modo, setModo] = useState(enlace?.tipo === "nueva" ? "nueva" : "entrar");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [repetida, setRepetida] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState(enlace?.tipo === "error" ? "Ese enlace ya venció o ya se usó. Pide otro." : "");
  const [aviso, setAviso] = useState(enlace?.tipo === "confirmado" ? "¡Listo! Tu correo quedó confirmado. Ya puedes entrar." : "");
  const [enviando, setEnviando] = useState(false);

  // el enlace del correo se usa una vez: se quita de la barra de direcciones
  useEffect(() => {
    if (enlace && typeof history !== "undefined") history.replaceState(null, "", location.pathname);
  }, [enlace]);

  function cambiarModo(m) {
    setModo(m);
    setError("");
    setAviso("");
    setContrasena("");
    setRepetida("");
  }

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setAviso("");
    // al entrar decide el servidor (la cuenta de superusuario puede no ser institucional)
    if ((modo === "crear" || modo === "recuperar") && !esCorreoInstitucional(correo)) {
      return setError(`Usa tu correo institucional (${dominiosEnTexto()}).`);
    }
    if ((modo === "crear" || modo === "nueva") && contrasena !== repetida) return setError("Las dos contraseñas no son iguales.");

    const cuerpo = {
      entrar: { correo, contrasena },
      crear: { accion: "crear", correo, contrasena },
      recuperar: { accion: "recuperar", correo },
      nueva: { accion: "contrasenaNueva", token: enlace?.token, contrasena },
      clave: { clave },
    }[modo];

    setEnviando(true);
    try {
      const r = await fetch("/api/editores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo. Intenta otra vez.");
      if (modo === "entrar" || modo === "clave") return onEntrar({ pase: d.pase, correo: d.correo || null });
      if (modo === "nueva") {
        cambiarModo("entrar");
        setAviso("Tu contraseña quedó cambiada. Ya puedes entrar con ella.");
        return;
      }
      setAviso(d.mensaje);
      if (modo === "crear") {
        setContrasena("");
        setRepetida("");
      }
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Sin conexión. Revisa el internet." : err.message);
    } finally {
      setEnviando(false);
    }
  }

  const pideCorreo = modo === "entrar" || modo === "crear" || modo === "recuperar";
  const pideContrasena = modo === "entrar" || modo === "crear" || modo === "nueva";
  const nuevaContrasena = modo === "crear" || modo === "nueva";

  return (
    <div className="pantalla editores editores--entrar">
      <form className="ajustes cuenta ed-entrar" onSubmit={enviar}>
        <h1><Icono nombre="candado" /> Administración de encuestas</h1>
        <p className="cuenta__nota">Resultados de las encuestas de los juegos, en vivo. {TITULOS[modo]}</p>

        {pideCorreo && (
          <div className="cuenta__campo">
          <label htmlFor="ed-correo">
            <span>Correo institucional</span>
            <input
              id="ed-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
              autoComplete="username" inputMode="email" maxLength={254} required autoFocus
              placeholder={`nombre@${DOMINIOS_INSTITUCIONALES[0]}`} aria-describedby="ed-correo-ayuda"
            />
          </label>
          <small id="ed-correo-ayuda" className="ed-ayuda">Solo correos {dominiosEnTexto()}</small>
          </div>
        )}
        {pideContrasena && (
          <div className="cuenta__campo">
          <label htmlFor="ed-contrasena">
            <span>{modo === "nueva" ? "Contraseña nueva" : "Contraseña"}</span>
            <input
              id="ed-contrasena" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
              autoComplete={nuevaContrasena ? "new-password" : "current-password"}
              minLength={nuevaContrasena ? MINIMO : 6} maxLength={128} required autoFocus={modo === "nueva"}
              aria-describedby={nuevaContrasena ? "ed-contrasena-ayuda" : undefined}
            />
          </label>
          {nuevaContrasena && <small id="ed-contrasena-ayuda" className="ed-ayuda">{MINIMO} caracteres o más</small>}
          </div>
        )}
        {nuevaContrasena && (
          <label className="cuenta__campo" htmlFor="ed-repetida">
            <span>Repite la contraseña</span>
            <input id="ed-repetida" type="password" value={repetida} onChange={(e) => setRepetida(e.target.value)} autoComplete="new-password" minLength={MINIMO} maxLength={128} required />
          </label>
        )}
        {modo === "clave" && (
          <label className="cuenta__campo" htmlFor="ed-clave">
            <span>Clave</span>
            <input id="ed-clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required autoFocus />
          </label>
        )}

        {error && <p className="cuenta__error" role="alert">{error}</p>}
        {aviso && <p className="ed-aviso" role="status">{aviso}</p>}
        <button className="boton-grande" type="submit" disabled={enviando}>{enviando ? "Un momento…" : BOTONES[modo]}</button>

        <nav className="ed-modos" aria-label="Otras opciones">
          {modo !== "entrar" && <button type="button" className="ed-otra-forma" onClick={() => cambiarModo("entrar")}>Ya tengo cuenta: entrar</button>}
          {modo === "entrar" && <button type="button" className="ed-otra-forma" onClick={() => cambiarModo("crear")}>Crear mi cuenta</button>}
          {modo === "entrar" && <button type="button" className="ed-otra-forma" onClick={() => cambiarModo("recuperar")}>¿Olvidaste tu contraseña?</button>}
          {modo !== "clave" && modo !== "nueva" && (
            <button type="button" className="ed-otra-forma ed-otra-forma--chica" onClick={() => cambiarModo("clave")}>Entrar con la clave de administración</button>
          )}
        </nav>
        <a className="ed-volver" href="/">Volver al juego</a>
      </form>
    </div>
  );
}
