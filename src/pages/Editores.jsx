import { useState, useEffect, useMemo, useCallback } from "react";
import {
  resumir, rellenarDias, porcentaje, csvResultados,
  ETIQUETAS_GUSTO, ETIQUETAS_DIFICULTAD,
} from "../lib/resultados.js";
import { caritaDe } from "../data/evaluacion.js";
import { temaInicial, guardarTema, aplicarTema } from "../lib/tema.js";
import Icono from "../components/Icono.jsx";
import BotonTema from "../components/BotonTema.jsx";

/**
 * Ventana de editores (/editores): resultados de las encuestas de satisfacción de los juegos
 * en gráficas, con filtros y descarga en PDF. Protegida con la clave de editores
 * (EDITORES_CLAVE en el servidor). Solo ve números resumidos: nunca quién contestó.
 */

const LLAVE_PASE = "escuadron-editor";
const PERIODOS = [
  { id: "7", texto: "7 días", dias: 7 },
  { id: "30", texto: "30 días", dias: 30 },
  { id: "90", texto: "90 días", dias: 90 },
  { id: "todo", texto: "Todo", dias: null },
];
const GRADOS = [["todos", "Todos"], ["primaria", "Primaria"], ["secundaria", "Secundaria"]];
const TIPOS = [["todos", "Todos"], ["minijuego", "Minijuegos"], ["mision", "Misiones"]];

const leerPase = () => { try { return sessionStorage.getItem(LLAVE_PASE); } catch { return null; } };
const guardarPase = (p) => { try { p ? sessionStorage.setItem(LLAVE_PASE, p) : sessionStorage.removeItem(LLAVE_PASE); } catch { /* nada */ } };

function fechaLocal(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const fechaCorta = (k) => new Date(k + "T12:00:00Z").toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });

/* ---------------- piezas de las gráficas ---------------- */

function Leyenda({ etiquetas, prefijo }) {
  return (
    <ul className="ed-leyenda" aria-label="Leyenda">
      {etiquetas.map((e, i) => (
        <li key={e.texto}>
          <span className={`ed-muestra ${prefijo}${i + 1}`} aria-hidden="true" />
          <span aria-hidden="true">{e.emoji}</span> {e.texto}
        </li>
      ))}
    </ul>
  );
}

/** Barras horizontales apiladas al 100 %: una por juego. */
function Apiladas({ juegos, valores, etiquetas, prefijo, onTip, derecha }) {
  return (
    <ul className="ed-apiladas">
      {juegos.map((j) => {
        const vs = valores(j);
        const total = vs.reduce((s, n) => s + n, 0) || 1;
        return (
          <li key={j.juego}>
            <span className="ed-apiladas__nombre" title={j.nombre}>{j.nombre}</span>
            <span className="ed-apiladas__barra">
              {vs.map((n, i) =>
                n ? (
                  <span
                    key={i}
                    className={`ed-seg ${prefijo}${i + 1}`}
                    style={{ flexGrow: n }}
                    onPointerEnter={(e) => onTip(e, `${j.nombre}\n${etiquetas[i].emoji} ${etiquetas[i].texto}: ${n} (${porcentaje(n, total)}%)`)}
                    onPointerMove={(e) => onTip(e)}
                    onPointerLeave={() => onTip(null)}
                  />
                ) : null
              )}
            </span>
            <span className="ed-apiladas__dato">{derecha(j)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PorDia({ dias, onTip }) {
  const llenos = rellenarDias(dias);
  if (!llenos.length) return null;
  const max = Math.max(...llenos.map((d) => d.total), 1);
  const ancho = 640, alto = 160;
  const paso = ancho / llenos.length;
  const barra = Math.max(2, Math.min(28, paso - 2));
  // las etiquetas van en HTML (no dentro del SVG) para que no se encojan en el celular
  return (
    <figure className="ed-dias-caja">
    <span className="ed-dias__eje ed-dias__max">{max} {max === 1 ? "respuesta" : "respuestas"}</span>
    <svg className="ed-dias" viewBox={`0 0 ${ancho} ${alto}`} role="img"
      aria-label={`Respuestas por día, del ${fechaCorta(llenos[0].dia)} al ${fechaCorta(llenos[llenos.length - 1].dia)}. Máximo ${max} en un día.`}>
      <line x1="0" x2={ancho} y1="10" y2="10" className="ed-dias__guia" />
      <line x1="0" x2={ancho} y1={alto} y2={alto} className="ed-dias__base" />
      {llenos.map((d, i) => {
        const h = (d.total / max) * (alto - 10);
        const x = i * paso + (paso - barra) / 2;
        return (
          <g key={d.dia}
            onPointerEnter={(e) => onTip(e, `${fechaCorta(d.dia)}: ${d.total} ${d.total === 1 ? "respuesta" : "respuestas"}`)}
            onPointerMove={(e) => onTip(e)}
            onPointerLeave={() => onTip(null)}>
            {/* zona de toque más grande que la barra */}
            <rect x={i * paso} y="0" width={paso} height={alto} fill="transparent" />
            {h > 0 && <path className="ed-dias__barra" d={`M${x},${alto} V${alto - h + Math.min(4, h)} q0,-4 4,-4 h${barra - 8} q4,0 4,4 V${alto} z`} />}
          </g>
        );
      })}
    </svg>
    <figcaption className="ed-dias__fechas">
      <span className="ed-dias__eje">{fechaCorta(llenos[0].dia)}</span>
      <span className="ed-dias__eje">{fechaCorta(llenos[llenos.length - 1].dia)}</span>
    </figcaption>
    </figure>
  );
}

function Segmentos({ etiqueta, opciones, valor, onCambiar }) {
  return (
    <div className="ed-filtro" role="group" aria-label={etiqueta}>
      <span className="ed-filtro__etiqueta">{etiqueta}</span>
      {opciones.map(([id, texto]) => (
        <button key={id} type="button" aria-pressed={valor === id} className={valor === id ? "activo" : ""} onClick={() => onCambiar(id)}>
          {texto}
        </button>
      ))}
    </div>
  );
}

/* ---------------- página ---------------- */

export default function Editores() {
  const [pase, setPase] = useState(() => leerPase());
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [filas, setFilas] = useState(null);
  const [periodo, setPeriodo] = useState("30");
  const [grado, setGrado] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [tip, setTip] = useState(null);
  const [haciendoPdf, setHaciendoPdf] = useState(false);

  const [tema, setTema] = useState(temaInicial);
  useEffect(() => {
    document.title = "Resultados de las encuestas · Escuadrón";
  }, []);
  useEffect(() => aplicarTema(tema), [tema]);
  const alternarTema = () => {
    const nuevo = tema === "oscuro" ? "claro" : "oscuro";
    guardarTema(nuevo);
    setTema(nuevo);
  };

  const cargar = useCallback(async () => {
    if (!pase) return;
    setCargando(true);
    setError("");
    const dias = PERIODOS.find((p) => p.id === periodo)?.dias;
    const desde = dias ? fechaLocal(new Date(Date.now() - (dias - 1) * 86_400_000)) : null;
    try {
      const r = await fetch(`/api/editores${desde ? `?desde=${desde}` : ""}`, { headers: { Authorization: "Bearer " + pase } });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) {
        guardarPase(null);
        setPase(null);
        setError(d.error || "Vuelve a escribir la clave.");
        return;
      }
      if (!r.ok) throw new Error(d.error || "No pude leer las encuestas.");
      setFilas(d.filas || []);
    } catch (e) {
      setError(e.message === "Failed to fetch" ? "Sin conexión. Revisa el internet." : e.message);
    } finally {
      setCargando(false);
    }
  }, [pase, periodo]);

  useEffect(() => { cargar(); }, [cargar]);

  const resumen = useMemo(() => (filas ? resumir(filas, { grado, tipo }) : null), [filas, grado, tipo]);

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const r = await fetch("/api/editores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clave }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo entrar.");
      guardarPase(d.pase);
      setPase(d.pase);
      setClave("");
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Sin conexión. Revisa el internet." : err.message);
    } finally {
      setCargando(false);
    }
  }

  function mostrarTip(e, texto) {
    if (!e) return setTip(null);
    setTip((t) => ({ x: e.clientX, y: e.clientY, texto: texto ?? t?.texto ?? "" }));
  }

  function descargarCsv() {
    const url = URL.createObjectURL(new Blob([csvResultados(resumen)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `encuestas-escuadron-${fechaLocal(new Date())}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function pdf() {
    setHaciendoPdf(true);
    try {
      const { descargarPdf } = await import("../lib/pdfResultados.js");
      await descargarPdf(resumen, {
        periodo: PERIODOS.find((p) => p.id === periodo).texto === "Todo" ? "todo" : `últimos ${PERIODOS.find((p) => p.id === periodo).texto}`,
        grado: GRADOS.find(([id]) => id === grado)[1],
        tipo: TIPOS.find(([id]) => id === tipo)[1],
      });
    } catch (e) {
      setError("No pude crear el PDF: " + e.message);
    } finally {
      setHaciendoPdf(false);
    }
  }

  if (!pase) {
    return (
      <main className="pantalla editores editores--entrar">
        <form className="ajustes cuenta ed-entrar" onSubmit={entrar}>
          <h1><Icono nombre="candado" /> Ventana de editores</h1>
          <p className="cuenta__nota">Resultados de las encuestas de los juegos. Escribe la clave de editores.</p>
          <label className="cuenta__campo" htmlFor="ed-clave">
            <span>Clave</span>
            <input id="ed-clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required autoFocus />
          </label>
          {error && <p className="cuenta__error" role="alert">{error}</p>}
          <button className="boton-grande" type="submit" disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</button>
          <a className="ed-volver" href="/">Volver al juego</a>
        </form>
      </main>
    );
  }

  const g = resumen?.general;
  const carita = g?.total ? caritaDe(g.promedio) : null;

  return (
    <main className="pantalla logros editores">
      <header className="logros__cabeza ed-cabeza">
        <span className="ed-arriba">
          <a className="volver" href="/"><Icono nombre="volver" /> Al juego</a>
          <BotonTema tema={tema} onTema={alternarTema} />
        </span>
        <h1>Resultados de las encuestas</h1>
        <p className="logros__nota">Lo que contestan los niños al terminar cada juego: «¿Te gustó?» y «¿Cómo estuvo de difícil?».</p>
      </header>

      <section className="logros__seccion ed-filtros">
        <Segmentos etiqueta="Periodo" opciones={PERIODOS.map((p) => [p.id, p.texto])} valor={periodo} onCambiar={setPeriodo} />
        <Segmentos etiqueta="Grado" opciones={GRADOS} valor={grado} onCambiar={setGrado} />
        <Segmentos etiqueta="Tipo" opciones={TIPOS} valor={tipo} onCambiar={setTipo} />
        <span className="ed-acciones">
          <button type="button" onClick={cargar} disabled={cargando}>{cargando ? "Cargando…" : "Actualizar"}</button>
          <button type="button" className="ed-pdf" onClick={pdf} disabled={!resumen || haciendoPdf}>
            <Icono nombre="descargar" /> {haciendoPdf ? "Creando PDF…" : "Descargar PDF"}
          </button>
          <button type="button" onClick={descargarCsv} disabled={!resumen?.juegos.length}>
            <Icono nombre="descargar" /> Excel (CSV)
          </button>
          <button type="button" onClick={() => { guardarPase(null); setPase(null); setFilas(null); }}>Salir</button>
        </span>
      </section>

      {error && <section className="logros__seccion"><p className="cuenta__error" role="alert">{error}</p></section>}
      {!resumen && cargando && <p className="maestro__cargando" role="status">Cargando resultados…</p>}

      {resumen && (
        <>
          <section className="logros__seccion">
            <dl className="logros__cifras ed-cifras">
              <div><dt>Respuestas</dt><dd>{g.total}</dd></div>
              <div>
                <dt>¿Les gustó?</dt>
                <dd>{carita ? <><span aria-hidden="true">{carita.emoji}</span> {g.promedio.toFixed(1)}<small> / 5</small></> : "—"}</dd>
              </div>
              <div><dt>Dificultad «justa»</dt><dd>{g.total ? `${porcentaje(g.dificultad[1], g.total)}%` : "—"}</dd></div>
              <div><dt>Juegos evaluados</dt><dd>{resumen.juegos.length}</dd></div>
            </dl>
          </section>

          {resumen.juegos.length === 0 ? (
            <section className="logros__seccion">
              <p className="logros__nota">No hay respuestas con estos filtros. Prueba con un periodo más largo.</p>
            </section>
          ) : (
            <>
              <section className="logros__seccion ed-tarjeta">
                <h2>¿Les gustó? por juego <small>del favorito al que menos</small></h2>
                <Leyenda etiquetas={ETIQUETAS_GUSTO} prefijo="g" />
                <Apiladas
                  juegos={resumen.juegos}
                  valores={(j) => j.gusto}
                  etiquetas={ETIQUETAS_GUSTO}
                  prefijo="g"
                  onTip={mostrarTip}
                  derecha={(j) => <><b>{j.promedio.toFixed(1)}</b> · {j.total}</>}
                />
              </section>

              <section className="logros__seccion ed-tarjeta">
                <h2>¿Qué tan difícil fue? <small>lo ideal: que la mayoría diga «Justo»</small></h2>
                <Leyenda etiquetas={ETIQUETAS_DIFICULTAD} prefijo="d" />
                <Apiladas
                  juegos={resumen.juegos}
                  valores={(j) => j.dificultad}
                  etiquetas={ETIQUETAS_DIFICULTAD}
                  prefijo="d"
                  onTip={mostrarTip}
                  derecha={(j) => <><b>{porcentaje(j.dificultad[1], j.total)}%</b> justo</>}
                />
              </section>

              <section className="logros__seccion ed-tarjeta">
                <h2>Respuestas por día</h2>
                <PorDia dias={resumen.dias} onTip={mostrarTip} />
              </section>

              <section className="logros__seccion ed-tarjeta">
                <details>
                  <summary>Ver la tabla con todos los números</summary>
                  <div className="maestro__tabla-caja">
                    <table className="maestro__tabla">
                      <thead>
                        <tr>
                          <th scope="col">Juego</th><th scope="col">Respuestas</th><th scope="col">Promedio</th>
                          {ETIQUETAS_GUSTO.map((e) => <th key={e.texto} scope="col"><span aria-hidden="true">{e.emoji}</span> {e.texto}</th>)}
                          {ETIQUETAS_DIFICULTAD.map((e) => <th key={e.texto} scope="col"><span aria-hidden="true">{e.emoji}</span> {e.texto}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.juegos.map((j) => (
                          <tr key={j.juego}>
                            <th scope="row">{j.nombre}</th><td>{j.total}</td><td>{j.promedio.toFixed(1)}</td>
                            {j.gusto.map((n, i) => <td key={`g${i}`}>{n}</td>)}
                            {j.dificultad.map((n, i) => <td key={`d${i}`}>{n}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </section>
            </>
          )}

          {resumen.fueraDeCatalogo > 0 && (
            <p className="logros__nota ed-nota">
              No se cuentan {resumen.fueraDeCatalogo} respuestas de juegos que no están en el catálogo (pruebas o juegos retirados).
            </p>
          )}
        </>
      )}

      {tip && (
        <div className="ed-tip" role="tooltip" style={{ left: tip.x + 14, top: tip.y + 14 }}>
          {tip.texto}
        </div>
      )}
    </main>
  );
}
