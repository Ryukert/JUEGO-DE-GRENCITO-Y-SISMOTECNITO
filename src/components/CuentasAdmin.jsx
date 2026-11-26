import { useState, useEffect, useCallback } from "react";
import { esCorreoInstitucional } from "../data/institucion.js";
import { MINIMO } from "./EntrarAdmin.jsx";

/**
 * Ya dentro de la administración:
 *   - MiContrasena: cualquiera con cuenta cambia su contraseña (pide la actual). Sirve también a
 *     quien no tiene correo institucional, que no puede usar «¿Olvidaste tu contraseña?».
 *   - CuentasAdmin: solo el superusuario. Lista las cuentas, agrega cuentas ya confirmadas
 *     (p. ej. de otra universidad), cambia roles, bloquea y pone contraseñas.
 * Todo pasa por POST /api/editores con el pase; la base de datos vuelve a revisar el rol.
 */

export const ROLES = {
  admin: { texto: "Administrador", ayuda: "Entra aunque su correo no sea institucional" },
  superusuario: { texto: "Superusuario", ayuda: "Entra y administra las cuentas" },
  bloqueado: { texto: "Bloqueado", ayuda: "No puede entrar" },
  ninguno: { texto: "Sin rol", ayuda: "Entra solo si su correo es institucional" },
};

/** Lo que significa en la práctica el rol de una cuenta. */
export function describirRol(cuenta) {
  if (cuenta.rol === "bloqueado") return "Bloqueado";
  if (cuenta.rol === "superusuario") return "Superusuario";
  if (cuenta.rol === "admin") return "Administrador";
  if (!cuenta.confirmado) return "Falta confirmar su correo";
  return esCorreoInstitucional(cuenta.correo) ? "Administrador (correo institucional)" : "Sin acceso (correo no institucional)";
}

const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "Nunca");

async function pedir(pase, cuerpo) {
  let r;
  try {
    r = await fetch("/api/editores", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + pase },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw Object.assign(new Error("Sin conexión. Revisa el internet."), { estado: 0 });
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || "No se pudo. Intenta otra vez."), { estado: r.status });
  return d;
}

export function MiContrasena({ pase, onVencido }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setAviso("");
    if (nueva !== repetida) return setError("Las dos contraseñas nuevas no son iguales.");
    setEnviando(true);
    try {
      await pedir(pase, { accion: "miContrasena", actual, nueva });
      setActual(""); setNueva(""); setRepetida("");
      setAviso("Listo: tu contraseña quedó cambiada. La próxima vez entra con la nueva.");
    } catch (err) {
      if (err.estado === 401 && /sesión/.test(err.message)) return onVencido?.(err.message);
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="ed-form" onSubmit={enviar}>
      <label className="cuenta__campo" htmlFor="mc-actual">
        <span>Contraseña actual</span>
        <input id="mc-actual" type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" minLength={6} maxLength={128} required />
      </label>
      <div className="cuenta__campo">
        <label htmlFor="mc-nueva">
          <span>Contraseña nueva</span>
          <input id="mc-nueva" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" minLength={MINIMO} maxLength={128} required aria-describedby="mc-nueva-ayuda" />
        </label>
        <small id="mc-nueva-ayuda" className="ed-ayuda">{MINIMO} caracteres o más</small>
      </div>
      <label className="cuenta__campo" htmlFor="mc-repetida">
        <span>Repite la contraseña nueva</span>
        <input id="mc-repetida" type="password" value={repetida} onChange={(e) => setRepetida(e.target.value)} autoComplete="new-password" minLength={MINIMO} maxLength={128} required />
      </label>
      {error && <p className="cuenta__error" role="alert">{error}</p>}
      {aviso && <p className="ed-aviso" role="status">{aviso}</p>}
      <button className="ed-boton" type="submit" disabled={enviando}>{enviando ? "Un momento…" : "Cambiar mi contraseña"}</button>
    </form>
  );
}

function NuevaCuenta({ pase, onCreada, onVencido }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState("admin");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await pedir(pase, { accion: "nuevaCuenta", correo, contrasena, rol });
      onCreada(`Listo: ${correo.trim().toLowerCase()} ya puede entrar con la contraseña que le pusiste. Pídele que la cambie al entrar.`);
      setCorreo(""); setContrasena(""); setRol("admin");
    } catch (err) {
      if (err.estado === 401) return onVencido?.(err.message);
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="ed-form ed-form--fila" onSubmit={enviar} aria-labelledby="nc-titulo">
      <h3 id="nc-titulo">Agregar una cuenta</h3>
      <p className="ed-ayuda ed-form__nota">
        Queda confirmada al momento. Úsalo para correos de otra institución; con correo institucional cada quien puede crear la suya.
      </p>
      <label className="cuenta__campo" htmlFor="nc-correo">
        <span>Correo</span>
        <input id="nc-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="off" inputMode="email" maxLength={254} required />
      </label>
      <label className="cuenta__campo" htmlFor="nc-contrasena">
        <span>Contraseña para empezar</span>
        <input id="nc-contrasena" type="text" value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoComplete="off" spellCheck={false} minLength={MINIMO} maxLength={128} required />
      </label>
      <label className="cuenta__campo" htmlFor="nc-rol">
        <span>Rol</span>
        <select id="nc-rol" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="admin">{ROLES.admin.texto}</option>
          <option value="superusuario">{ROLES.superusuario.texto}</option>
        </select>
      </label>
      {error && <p className="cuenta__error" role="alert">{error}</p>}
      <button className="ed-boton" type="submit" disabled={enviando}>{enviando ? "Agregando…" : "Agregar"}</button>
    </form>
  );
}

function PonerContrasena({ cuenta, pase, onListo, onCancelar, onVencido }) {
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await pedir(pase, { accion: "contrasenaDe", id: cuenta.id, contrasena });
      onListo(`La contraseña de ${cuenta.correo} quedó cambiada. Dísela en persona y pídele que la cambie al entrar.`);
    } catch (err) {
      if (err.estado === 401) return onVencido?.(err.message);
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }
  const id = `pc-${cuenta.id}`;
  return (
    <form className="ed-form ed-form--fila" onSubmit={enviar}>
      <label className="cuenta__campo" htmlFor={id}>
        <span>Contraseña nueva para {cuenta.correo}</span>
        <input id={id} type="text" value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoComplete="off" spellCheck={false} minLength={MINIMO} maxLength={128} required autoFocus />
      </label>
      {error && <p className="cuenta__error" role="alert">{error}</p>}
      <span className="ed-form__botones">
        <button className="ed-boton" type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</button>
        <button className="ed-boton ed-boton--suave" type="button" onClick={onCancelar}>Cancelar</button>
      </span>
    </form>
  );
}

export function CuentasAdmin({ pase, onVencido }) {
  const [cuentas, setCuentas] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupada, setOcupada] = useState(null);       // id de la cuenta que se está cambiando
  const [contrasenaDe, setContrasenaDe] = useState(null);

  const vencido = useCallback((m) => onVencido?.(m), [onVencido]);

  const cargar = useCallback(async () => {
    try {
      const d = await pedir(pase, { accion: "cuentas" });
      setCuentas(d.cuentas || []);
      setError("");
    } catch (err) {
      if (err.estado === 401) return vencido(err.message);
      setError(err.message);
    }
  }, [pase, vencido]);
  useEffect(() => { cargar(); }, [cargar]);

  async function cambiar(cuenta, rol) {
    if (rol === "bloqueado" && !window.confirm(`¿Bloquear a ${cuenta.correo}? Ya no podrá entrar a la administración.`)) return;
    setOcupada(cuenta.id);
    setError("");
    setAviso("");
    try {
      await pedir(pase, { accion: "cambiarRol", id: cuenta.id, rol });
      setAviso(`${cuenta.correo}: ${ROLES[rol].texto.toLowerCase()}.`);
      await cargar();
    } catch (err) {
      if (err.estado === 401) return vencido(err.message);
      setError(err.message);
    } finally {
      setOcupada(null);
    }
  }

  function listo(mensaje) {
    setAviso(mensaje);
    setError("");
    setContrasenaDe(null);
    cargar();
  }

  return (
    <div className="ed-cuentas">
      <NuevaCuenta pase={pase} onCreada={listo} onVencido={vencido} />

      {error && <p className="cuenta__error" role="alert">{error}</p>}
      <p className="ed-aviso-vivo" role="status">{aviso && <span className="ed-aviso">{aviso}</span>}</p>

      {!cuentas && !error && <p className="maestro__cargando" role="status">Cargando cuentas…</p>}
      {cuentas && (
        <div className="maestro__tabla-caja">
          <table className="maestro__tabla ed-cuentas__tabla">
            <caption className="visualmente-oculto">Cuentas de administración</caption>
            <thead>
              <tr>
                <th scope="col">Correo</th>
                <th scope="col">Acceso</th>
                <th scope="col">Último acceso</th>
                <th scope="col">Cambiar</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id} className={c.rol === "bloqueado" ? "ed-cuentas__bloqueada" : undefined}>
                  <th scope="row">{c.correo}{c.yo && <span className="ed-cuentas__yo"> (tú)</span>}</th>
                  <td>{describirRol(c)}</td>
                  <td>{fecha(c.ultimo_acceso)}</td>
                  <td>
                    {c.yo ? (
                      <span className="ed-ayuda">Tu contraseña se cambia en «Mi cuenta»</span>
                    ) : contrasenaDe === c.id ? (
                      <PonerContrasena cuenta={c} pase={pase} onListo={listo} onCancelar={() => setContrasenaDe(null)} onVencido={vencido} />
                    ) : (
                      <span className="ed-cuentas__acciones">
                        <label className="visualmente-oculto" htmlFor={`rol-${c.id}`}>Rol de {c.correo}</label>
                        <select
                          id={`rol-${c.id}`} value={c.rol || "ninguno"} disabled={ocupada === c.id}
                          onChange={(e) => cambiar(c, e.target.value)}
                        >
                          {Object.entries(ROLES).map(([id, r]) => <option key={id} value={id} title={r.ayuda}>{r.texto}</option>)}
                        </select>
                        <button type="button" className="ed-boton ed-boton--suave" onClick={() => setContrasenaDe(c.id)}>
                          Poner contraseña
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <dl className="ed-roles">
        {Object.values(ROLES).map((r) => (
          <div key={r.texto}><dt>{r.texto}</dt><dd>{r.ayuda}</dd></div>
        ))}
      </dl>
    </div>
  );
}
