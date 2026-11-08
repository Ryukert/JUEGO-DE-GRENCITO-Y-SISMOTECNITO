import { useState, useEffect, useCallback } from "react";
import { PERSONAJES, GRADOS } from "../data/personajes.js";
import { rangoPara } from "../lib/progreso.js";
import { panelGrupo, cambiarPin, quitarAlumno, salirMaestro, leerMaestro, ponerTarea, borrarTarea } from "../lib/cuenta.js";
import Icono from "../components/Icono.jsx";
import { IconoRango } from "../components/IconoJuego.jsx";
import { ESCALA, DIFICULTAD, MINIMO_ANONIMO, caritaDe } from "../data/evaluacion.js";
import { POR_ID, JUEGOS, FAMILIAS } from "../juegos/registro.js";

const MAX_TAREA = 5;
const NOMBRES = Object.fromEntries(JUEGOS.map((j) => [j.id, j.nombre]));

/**
 * Panel del maestro: código del grupo para dictarlo, la tarea, el avance de cada alumno y por
 * tema, y las preguntas que más cuestan. Se puede poner un PIN nuevo a quien lo olvidó, quitar
 * alumnos y bajar un CSV o un PDF.
 */

const relativo = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
export function haceCuanto(fecha, ahora = Date.now()) {
  const dias = Math.round((new Date(fecha).getTime() - ahora) / 86_400_000);
  if (dias === 0) {
    const horas = Math.round((new Date(fecha).getTime() - ahora) / 3_600_000);
    return horas === 0 ? "ahora" : relativo.format(horas, "hour");
  }
  return relativo.format(dias, "day");
}
const porciento = (a, t) => (t ? Math.round((a / t) * 100) : null);

function csv(alumnos) {
  const celda = (v) => {
    const t = String(v ?? "");
    // =, +, - o @ al inicio: Excel lo tomaría como fórmula
    const seguro = /^[=+\-@]/.test(t) ? "'" + t : t;
    return /[",\n;]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
  };
  const filas = [["Apodo", "XP", "Récord Tecnito", "Récord Greencito", "Misiones", "Minijuegos", "Respuestas", "Aciertos %", "Última vez"]];
  for (const a of alumnos) {
    filas.push([
      a.apodo, a.xp, a.records.sismo, a.records.green, a.misiones, a.minijuegos,
      a.respuestas.total, porciento(a.respuestas.aciertos, a.respuestas.total) ?? "",
      new Date(a.ultima_vez).toLocaleDateString("es-MX"),
    ]);
  }
  return "﻿" + filas.map((f) => f.map(celda).join(",")).join("\r\n");
}

/** Cómo evalúan los alumnos al maestro: carita promedio y barra de colores de rojo a verde. */
function ResumenEvaluacion({ ev }) {
  if (!ev) return null;
  return (
    <section className="logros__seccion">
      <h2>
        Cómo te evalúan tus alumnos{" "}
        <small>{ev.total} {ev.total === 1 ? "evaluación" : "evaluaciones"} · {ev.semana} esta semana · anónimas</small>
      </h2>
      {!ev.suficientes ? (
        <p className="logros__nota">
          Los resultados aparecen cuando al menos {MINIMO_ANONIMO} alumnos te evalúen, para que nadie sepa quién eligió
          qué. Ellos lo hacen desde «Mi grupo» → «Evaluar a mi maestro».
        </p>
      ) : (
        <ul className="evaluado">
          {ev.preguntas.map((p) => {
            const c = caritaDe(p.promedio);
            const suma = p.conteo.reduce((s, n) => s + n, 0) || 1;
            return (
              <li key={p.id} className="evaluado__pregunta">
                <span className="evaluado__promedio" style={{ "--carita": c.color }}>
                  <span aria-hidden="true">{c.emoji}</span>
                </span>
                <span className="evaluado__texto">
                  <strong>{p.texto}</strong>
                  <span>{p.promedio.toFixed(1)} de 5 · {c.etiqueta}</span>
                </span>
                <span
                  className="evaluado__barra"
                  role="img"
                  aria-label={ESCALA.map((e, i) => `${e.etiqueta}: ${p.conteo[i]}`).join(", ")}
                >
                  {ESCALA.map((e, i) =>
                    p.conteo[i] ? (
                      <span key={e.valor} style={{ width: `${(p.conteo[i] / suma) * 100}%`, background: e.color }} title={`${e.emoji} ${e.etiqueta}: ${p.conteo[i]}`} />
                    ) : null
                  )}
                </span>
                <span className="evaluado__conteo" aria-hidden="true">
                  {ESCALA.map((e, i) => (
                    <span key={e.valor}>{e.emoji} {p.conteo[i]}</span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const nombreJuego = (e) =>
  e.tipo === "mision"
    ? `Misiones de ${PERSONAJES[e.juego.replace("mision-", "")]?.nombre || "?"}`
    : POR_ID[e.juego]?.nombre || e.juego;

/** Qué juegos le gustan al grupo y cuáles se les hacen difíciles (encuestas al terminar cada juego). */
function ResumenEncuestas({ lista }) {
  if (!lista) return null;
  const total = lista.reduce((s, e) => s + e.total, 0);
  return (
    <section className="logros__seccion">
      <h2>Qué juegos les gustan <small>{total} {total === 1 ? "opinión" : "opiniones"} al terminar cada juego</small></h2>
      {lista.length === 0 ? (
        <p className="logros__nota">
          Al terminar un minijuego o una partida, el juego pregunta «¿Te gustó?» y «¿Cómo estuvo de difícil?».
          Aquí verás las respuestas de tu grupo.
        </p>
      ) : (
        <ul className="encuestas-panel">
          {lista.map((e) => {
            const c = caritaDe(e.promedio);
            return (
              <li key={e.juego}>
                <span className="evaluado__promedio evaluado__promedio--chico" style={{ "--carita": c.color }}>
                  <span aria-hidden="true">{c.emoji}</span>
                </span>
                <span className="encuestas-panel__nombre">
                  <strong>{nombreJuego(e)}</strong>
                  <small>{e.promedio.toFixed(1)} de 5 · {e.total} {e.total === 1 ? "opinión" : "opiniones"}</small>
                </span>
                <span className="encuestas-panel__dif" aria-label={DIFICULTAD.map((d, i) => `${d.etiqueta}: ${e.dificultad[i]}`).join(", ")}>
                  {DIFICULTAD.map((d, i) => (
                    <span key={d.valor} title={d.etiqueta} aria-hidden="true">{d.emoji} {e.dificultad[i]}</span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Tarea del grupo: hasta MAX_TAREA minijuegos del Centro y una nota; quién ya la terminó. */
function TareaGrupo({ tarea, alumnos, onCambio }) {
  const [editando, setEditando] = useState(false);
  const [elegidos, setElegidos] = useState(() => tarea?.juegos.filter((id) => NOMBRES[id]) || []);
  const [nota, setNota] = useState(tarea?.nota || "");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const terminaron = alumnos.filter((a) => a.tarea && a.tarea.hechos >= a.tarea.total).length;

  function abrir() {
    setElegidos(tarea?.juegos.filter((id) => NOMBRES[id]) || []);
    setNota(tarea?.nota || "");
    setAviso("");
    setEditando(true);
  }
  const alternar = (id) =>
    setElegidos((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length < MAX_TAREA ? [...l, id] : l));

  async function guardar(e) {
    e.preventDefault();
    setOcupado(true);
    setAviso("");
    try {
      await ponerTarea(elegidos, nota);
      setEditando(false);
      onCambio();
    } catch (err) {
      setAviso(err.message);
    } finally {
      setOcupado(false);
    }
  }
  async function quitar() {
    setOcupado(true);
    try {
      await borrarTarea();
      setEditando(false);
      onCambio();
    } catch (err) {
      setAviso(err.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="logros__seccion tarea-maestro">
      <h2>Tarea del grupo <small>hasta {MAX_TAREA} minijuegos del Centro</small></h2>
      {!editando && tarea && (
        <>
          <ul className="tarea-maestro__lista">
            {tarea.juegos.filter((id) => NOMBRES[id]).map((id) => <li key={id}>{NOMBRES[id]}</li>)}
          </ul>
          {tarea.nota && <p className="tarea-maestro__nota">«{tarea.nota}»</p>}
          <p className="logros__nota">
            Desde el {new Date(tarea.desde).toLocaleDateString("es-MX", { day: "numeric", month: "long" })} ·{" "}
            <strong>{terminaron} de {alumnos.length}</strong> alumnos ya la terminaron. Cuenta cuando juegan cada minijuego
            después de ponerla.
          </p>
        </>
      )}
      {!editando && !tarea && (
        <p className="logros__nota">
          Elige minijuegos para que tus alumnos los jueguen: les aparecen en la portada al entrar con su cuenta, y aquí ves quién
          ya los jugó.
        </p>
      )}
      {!editando && (
        <div className="maestro__pie">
          <button onClick={abrir}>{tarea ? "Cambiar la tarea" : "Poner una tarea"}</button>
          {tarea && <button onClick={quitar} disabled={ocupado}>Quitar la tarea</button>}
        </div>
      )}
      {editando && (
        <form className="tarea-maestro__form" onSubmit={guardar}>
          <p role="status" className="logros__nota">
            {elegidos.length} de {MAX_TAREA} elegidos{elegidos.length >= MAX_TAREA ? " (para cambiar uno, quita otro)" : ""}
          </p>
          {Object.values(FAMILIAS).map((f) => (
            <fieldset key={f.id} className="tarea-maestro__familia">
              <legend>{f.nombre}</legend>
              {JUEGOS.filter((j) => j.familia === f.id).map((j) => {
                const marcado = elegidos.includes(j.id);
                return (
                  <label key={j.id} className={marcado ? "marcado" : ""}>
                    <input
                      type="checkbox"
                      checked={marcado}
                      disabled={!marcado && elegidos.length >= MAX_TAREA}
                      onChange={() => alternar(j.id)}
                    />
                    {j.nombre}
                  </label>
                );
              })}
            </fieldset>
          ))}
          <label className="tarea-maestro__campo">
            Nota para el grupo (opcional)
            <input value={nota} maxLength={140} onChange={(e) => setNota(e.target.value)} placeholder="Por ejemplo: para el viernes" />
          </label>
          {aviso && <p className="cuenta__error" role="alert">{aviso}</p>}
          <div className="maestro__pie">
            <button type="submit" className="boton-grande" disabled={ocupado || elegidos.length === 0}>Guardar la tarea</button>
            <button type="button" onClick={() => setEditando(false)} disabled={ocupado}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}

/** Aciertos del grupo en cada tema de las misiones (las variantes de un reto cuentan juntas). */
function AvanceTemas({ temas }) {
  if (!temas) return null;
  return (
    <section className="logros__seccion">
      <h2>Avance por tema <small>aciertos del grupo en las misiones</small></h2>
      {temas.length === 0 ? (
        <p className="logros__nota">Aparece cuando el grupo juega las misiones.</p>
      ) : (
        <ul className="temas-maestro">
          {temas.map((t) => {
            const pct = porciento(t.aciertos, t.total) ?? 0;
            return (
              <li key={`${t.personaje}-${t.tema}`}>
                <span className="temas-maestro__nombre">
                  <img src={PERSONAJES[t.personaje]?.cara} alt="" width="28" height="28" />
                  <span>
                    <strong>{t.tema}</strong>
                    <small>{PERSONAJES[t.personaje]?.nombre}</small>
                  </span>
                </span>
                <span className="temas-maestro__barra" role="img" aria-label={`${pct}% de aciertos en ${t.total} respuestas`}>
                  <span style={{ width: `${pct}%` }} className={pct < 50 ? "bajo" : pct < 75 ? "medio" : "alto"} />
                </span>
                <span className="temas-maestro__cifra">{pct}% <small>de {t.total}</small></span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FilaAlumno({ a, conTarea, onCambio }) {
  const [aviso, setAviso] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const p = PERSONAJES[a.avatar] || PERSONAJES.sismo;
  const pct = porciento(a.respuestas.aciertos, a.respuestas.total);

  async function nuevoPin() {
    const pin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10_000).padStart(4, "0");
    setOcupado(true);
    try {
      await cambiarPin(a.id, pin);
      setAviso(`PIN nuevo: ${pin}`);
    } catch (e) {
      setAviso(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function quitar() {
    setOcupado(true);
    try {
      await quitarAlumno(a.id);
      onCambio();
    } catch (e) {
      setAviso(e.message);
      setOcupado(false);
    }
  }

  return (
    <tr>
      <th scope="row">
        <span className="maestro__alumno">
          <img src={p.cara} alt="" width="32" height="32" />
          {a.apodo}
        </span>
      </th>
      <td>{a.xp}</td>
      <td>
        {a.mejor > 0 ? (
          <span className="maestro__rango"><IconoRango rango={rangoPara(a.mejor)} /> {a.mejor}</span>
        ) : "—"}
      </td>
      <td>{a.misiones}</td>
      <td>{a.minijuegos}</td>
      <td>{pct === null ? "—" : `${pct}% de ${a.respuestas.total}`}</td>
      <td>{haceCuanto(a.ultima_vez)}</td>
      {conTarea && (
        <td>
          {a.tarea ? (
            a.tarea.hechos >= a.tarea.total ? (
              <span className="maestro__hecha"><Icono nombre="bien" /> lista</span>
            ) : (
              `${a.tarea.hechos} de ${a.tarea.total}`
            )
          ) : "—"}
        </td>
      )}
      <td className="maestro__acciones">
        {aviso && <span className="maestro__aviso" role="status">{aviso}</span>}
        {confirmar ? (
          <>
            <button className="maestro__peligro" onClick={quitar} disabled={ocupado}>Sí, quitar</button>
            <button onClick={() => setConfirmar(false)} disabled={ocupado}>No</button>
          </>
        ) : (
          <>
            <button onClick={nuevoPin} disabled={ocupado}>PIN nuevo</button>
            <button onClick={() => setConfirmar(true)} disabled={ocupado} aria-label={`Quitar a ${a.apodo} del grupo`}>Quitar</button>
          </>
        )}
      </td>
    </tr>
  );
}

export default function Maestro({ onSalir }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const guardado = leerMaestro();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setDatos(await panelGrupo());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const grupo = datos?.grupo || guardado?.grupo;
  const alumnos = datos?.alumnos || [];
  const semana = Date.now() - 7 * 86_400_000;
  const activos = alumnos.filter((a) => new Date(a.ultima_vez).getTime() > semana).length;
  const total = alumnos.reduce((s, a) => s + a.respuestas.total, 0);
  const aciertos = alumnos.reduce((s, a) => s + a.respuestas.aciertos, 0);
  const dificiles = (datos?.preguntas || []).filter((q) => q.total >= 3 && q.fallos > 0).slice(0, 8);
  const conTarea = !!datos?.tarea;
  const [haciendoPdf, setHaciendoPdf] = useState(false);

  async function pdf() {
    setHaciendoPdf(true);
    try {
      const { descargarPdfGrupo } = await import("../lib/pdfGrupo.js");
      await descargarPdfGrupo(datos, { nombres: NOMBRES });
    } catch (e) {
      setError("No se pudo armar el PDF: " + e.message);
    } finally {
      setHaciendoPdf(false);
    }
  }

  function descargar() {
    const url = URL.createObjectURL(new Blob([csv(alumnos)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `grupo-${grupo?.codigo || "escuadron"}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="pantalla logros maestro">
      <header className="logros__cabeza">
        <button className="volver" onClick={onSalir}>
          <Icono nombre="volver" /> Volver
        </button>
        <h1>
          <Icono nombre="grupo" /> {grupo?.nombre || "Mi grupo"}
        </h1>
        {grupo && (
          <p className="maestro__codigo">
            Código para tus alumnos: <strong aria-label={`Código ${grupo.codigo.split("").join(" ")}`}>{grupo.codigo}</strong>
            <small>{GRADOS[grupo.grado]?.nombre} · en la portada: «Mi grupo» → «Es mi primera vez»</small>
          </p>
        )}
        {datos && (
          <dl className="logros__cifras">
            <div><dt>Alumnos</dt><dd>{alumnos.length}</dd></div>
            <div><dt>Esta semana</dt><dd>{activos}</dd></div>
            <div><dt>Respuestas</dt><dd>{total}</dd></div>
            <div><dt>Aciertos</dt><dd>{total ? `${porciento(aciertos, total)}%` : "—"}</dd></div>
          </dl>
        )}
      </header>

      {error && (
        <section className="logros__seccion">
          <p className="cuenta__error" role="alert">{error}</p>
          {!leerMaestro() && <button onClick={onSalir}>Volver a entrar</button>}
        </section>
      )}
      {cargando && !datos && <p className="maestro__cargando" role="status">Cargando el grupo…</p>}

      {datos && (
        <>
          <section className="logros__seccion">
            <h2>Alumnos <small>{alumnos.length ? "ordenados por apodo" : ""}</small></h2>
            {alumnos.length === 0 ? (
              <p className="logros__nota">
                Todavía no entra nadie. Dicta el código <strong>{grupo.codigo}</strong>: cada alumno toca «Mi grupo»,
                elige «Es mi primera vez», escribe un apodo e inventa un PIN.
              </p>
            ) : (
              <div className="maestro__tabla-caja">
                <table className="maestro__tabla">
                  <thead>
                    <tr>
                      <th scope="col">Alumno</th><th scope="col">XP</th><th scope="col">Mejor récord</th>
                      <th scope="col">Misiones</th><th scope="col">Minijuegos</th><th scope="col">Aciertos</th>
                      <th scope="col">Última vez</th>{conTarea && <th scope="col">Tarea</th>}
                      <th scope="col"><span className="solo-lector">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((a) => <FilaAlumno key={a.id} a={a} conTarea={conTarea} onCambio={cargar} />)}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <TareaGrupo key={datos.tarea?.desde || "sin-tarea"} tarea={datos.tarea} alumnos={alumnos} onCambio={cargar} />
          <AvanceTemas temas={datos.temas} />
          <ResumenEvaluacion ev={datos.evaluacion} />
          <ResumenEncuestas lista={datos.encuestas} />

          <section className="logros__seccion">
            <h2>Preguntas que más cuestan <small>con 3 respuestas o más</small></h2>
            {dificiles.length === 0 ? (
              <p className="logros__nota">Aún no hay suficientes respuestas. Aparecen cuando el grupo juega las misiones.</p>
            ) : (
              <ol className="maestro__preguntas">
                {dificiles.map((q) => (
                  <li key={`${q.personaje}-${q.mision}-${q.bono}`}>
                    <span className="maestro__fallos">{porciento(q.fallos, q.total)}% falla</span>
                    <strong>{PERSONAJES[q.personaje]?.nombre} · {q.titulo}{q.bono ? " (bonificación)" : ""}</strong>
                    <p>{q.pregunta}</p>
                    <small>{q.fallos} de {q.total} respuestas</small>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="logros__seccion maestro__pie">
            <button onClick={cargar} disabled={cargando}>{cargando ? "Actualizando…" : "Actualizar"}</button>
            <button onClick={descargar} disabled={!alumnos.length}><Icono nombre="descargar" /> Descargar CSV</button>
            <button onClick={pdf} disabled={haciendoPdf}><Icono nombre="descargar" /> {haciendoPdf ? "Armando el PDF…" : "Descargar PDF"}</button>
            <button onClick={() => { salirMaestro(); onSalir(); }}>Cerrar el panel</button>
          </section>
        </>
      )}
    </div>
  );
}
