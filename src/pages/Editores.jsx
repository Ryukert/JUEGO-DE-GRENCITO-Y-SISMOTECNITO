import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  resumir, rellenarDias, porcentaje, csvResultados,
  ETIQUETAS_GUSTO, ETIQUETAS_DIFICULTAD,
} from "../lib/resultados.js";
import { caritaDe } from "../data/evaluacion.js";
import { temaInicial, guardarTema, aplicarTema } from "../lib/tema.js";
import Icono from "../components/Icono.jsx";
import BotonTema from "../components/BotonTema.jsx";
import { useEnVivo, novedades, haceCuanto, CADA, RESALTE } from "../lib/enVivo.js";
import EntrarAdmin from "../components/EntrarAdmin.jsx";
import { MiContrasena, CuentasAdmin } from "../components/CuentasAdmin.jsx";
import ResumenOpiniones from "../components/ResumenOpiniones.jsx";

/**
 * Administración de encuestas (/admin, /administradores o /editores): resultados de las
 * encuestas de satisfacción de los juegos en gráficas, con filtros y descarga en PDF y CSV.
 * Modo en vivo: las gráficas se actualizan solas cada 30 s (src/lib/enVivo.js) y se marca lo
 * que llegó de nuevo. Protegida con la clave de editores (EDITORES_CLAVE en el servidor).
 * Solo ve números resumidos: nunca quién contestó.
 */

const LLAVE_PASE = "escuadron-editor";
const LLAVE_CORREO = "escuadron-editor-correo";
const LLAVE_SUPER = "escuadron-editor-super";
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
const leerCorreo = () => { try { return sessionStorage.getItem(LLAVE_CORREO); } catch { return null; } };
const guardarCorreo = (c) => { try { c ? sessionStorage.setItem(LLAVE_CORREO, c) : sessionStorage.removeItem(LLAVE_CORREO); } catch { /* nada */ } };
// solo decide si se muestra el panel de cuentas: quien manda es el servidor (y la base de datos)
const leerSuper = () => { try { return sessionStorage.getItem(LLAVE_SUPER) === "1"; } catch { return false; } };
const guardarSuper = (s) => { try { s ? sessionStorage.setItem(LLAVE_SUPER, "1") : sessionStorage.removeItem(LLAVE_SUPER); } catch { /* nada */ } };

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
function Apiladas({ juegos, valores, etiquetas, prefijo, onTip, derecha, nuevos = [] }) {
  return (
    <ul className="ed-apiladas">
      {juegos.map((j) => {
        const vs = valores(j);
        const total = vs.reduce((s, n) => s + n, 0) || 1;
        return (
          <li key={j.juego} className={nuevos.includes(j.juego) ? "ed-nuevo" : undefined}>
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
  const [quien, setQuien] = useState(() => leerCorreo());
  const [esSuper, setEsSuper] = useState(() => leerSuper());
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [filas, setFilas] = useState(null);
  const [opiniones, setOpiniones] = useState(null);
  const [periodo, setPeriodo] = useState("30");
  const [grado, setGrado] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [tip, setTip] = useState(null);
  const [haciendoPdf, setHaciendoPdf] = useState(false);
  // modo en vivo
  const [enVivo, setEnVivo] = useState(true);
  const [actualizado, setActualizado] = useState(null);
  const [reloj, setReloj] = useState(() => Date.now());
  const [nuevas, setNuevas] = useState(null);   // { cantidad, juegos } de la última actualización
  const anteriores = useRef(null);
  const borrarNuevas = useRef(null);

  const [tema, setTema] = useState(temaInicial);
  useEffect(() => {
    document.title = "Administración de encuestas · Escuadrón";
  }, []);
  useEffect(() => aplicarTema(tema), [tema]);
  const alternarTema = () => {
    const nuevo = tema === "oscuro" ? "claro" : "oscuro";
    guardarTema(nuevo);
    setTema(nuevo);
  };

  /** silencioso: la actualización en vivo no muestra «Cargando…» ni borra los errores de antes */
  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!pase) return;
    if (!silencioso) setCargando(true);
    if (!silencioso) setError("");
    const dias = PERIODOS.find((p) => p.id === periodo)?.dias;
    const desde = dias ? fechaLocal(new Date(Date.now() - (dias - 1) * 86_400_000)) : null;
    // la evaluación abierta (/opinion) va aparte: si falla, las encuestas se ven igual
    fetch(`/api/opinion${desde ? `?desde=${desde}` : ""}`, { headers: { Authorization: "Bearer " + pase } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.filas) setOpiniones(d.filas); })
      .catch(() => {});
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
      const nuevasFilas = d.filas || [];
      // solo se comparan lecturas del mismo periodo
      const cambio = silencioso ? novedades(anteriores.current, nuevasFilas) : { nuevas: 0, juegos: [] };
      anteriores.current = nuevasFilas;
      setFilas(nuevasFilas);
      setActualizado(Date.now());
      setError("");
      if (cambio.nuevas > 0) {
        setNuevas({ cantidad: cambio.nuevas, juegos: cambio.juegos });
        clearTimeout(borrarNuevas.current);
        borrarNuevas.current = setTimeout(() => setNuevas(null), RESALTE);
      }
    } catch (e) {
      setError(e.message === "Failed to fetch" ? "Sin conexión. Revisa el internet." : e.message);
    } finally {
      setCargando(false);
    }
  }, [pase, periodo]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => () => clearTimeout(borrarNuevas.current), []);

  // en vivo: se vuelve a pedir cada 30 s mientras la pestaña está a la vista
  useEnVivo(() => cargar({ silencioso: true }), { activo: enVivo && !!pase });
  // el «hace 12 s» se mueve solo
  useEffect(() => {
    if (!pase) return undefined;
    const id = setInterval(() => setReloj(Date.now()), 5_000);
    return () => clearInterval(id);
  }, [pase]);

  const resumen = useMemo(() => (filas ? resumir(filas, { grado, tipo }) : null), [filas, grado, tipo]);

  function mostrarTip(e, texto) {
    if (!e) return setTip(null);
    setTip((t) => ({ x: e.clientX, y: e.clientY, texto: texto ?? t?.texto ?? "" }));
  }

  const salir = useCallback((mensaje = "") => {
    guardarPase(null); guardarCorreo(null); guardarSuper(false);
    setQuien(null); setEsSuper(false); setPase(null); setFilas(null); setOpiniones(null);
    anteriores.current = null;
    setError(mensaje);
  }, []);

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
      <EntrarAdmin
        onEntrar={({ pase: nuevo, correo: c, superusuario }) => {
          guardarPase(nuevo);
          guardarCorreo(c);
          guardarSuper(!!superusuario);
          setQuien(c);
          setEsSuper(!!superusuario);
          setPase(nuevo);
        }}
      />
    );
  }

  const g = resumen?.general;
  const carita = g?.total ? caritaDe(g.promedio) : null;

  return (
    <div className="pantalla logros editores">
      <header className="logros__cabeza ed-cabeza">
        <span className="ed-arriba">
          <a className="volver" href="/"><Icono nombre="volver" /> Al juego</a>
          <BotonTema tema={tema} onTema={alternarTema} />
        </span>
        <h1>Resultados de las encuestas</h1>
        {quien && (
          <p className="ed-quien">
            Entraste como <strong>{quien}</strong>{esSuper ? " (superusuario)" : ""} ·{" "}
            <a href="#mi-cuenta">Mi cuenta</a>
            {esSuper && <> · <a href="#cuentas">Cuentas de administración</a></>}
          </p>
        )}
        <p className="logros__nota">Lo que contestan los niños al terminar cada juego: «¿Te gustó?» y «¿Cómo estuvo de difícil?».</p>
        <p className={`ed-vivo ${enVivo ? "ed-vivo--on" : ""}`}>
          <span className="ed-vivo__punto" aria-hidden="true" />
          <span>
            {enVivo ? "En vivo" : "En pausa"}
            {actualizado ? ` · actualizado ${haceCuanto(actualizado, reloj)}` : ""}
            {enVivo ? ` · se actualiza cada ${CADA / 1000} s` : ""}
          </span>
          <button type="button" onClick={() => setEnVivo((v) => !v)} aria-pressed={!enVivo}>
            {enVivo ? "Pausar" : "Reanudar"}
          </button>
        </p>
        {/* para lectores de pantalla: avisa cuando llegan respuestas */}
        <p className="visualmente-oculto" aria-live="polite">
          {nuevas ? `${nuevas.cantidad} ${nuevas.cantidad === 1 ? "respuesta nueva" : "respuestas nuevas"}` : ""}
        </p>
      </header>

      <section className="logros__seccion ed-filtros">
        <Segmentos etiqueta="Periodo" opciones={PERIODOS.map((p) => [p.id, p.texto])} valor={periodo} onCambiar={setPeriodo} />
        <Segmentos etiqueta="Grado" opciones={GRADOS} valor={grado} onCambiar={setGrado} />
        <Segmentos etiqueta="Tipo" opciones={TIPOS} valor={tipo} onCambiar={setTipo} />
        <span className="ed-acciones">
          <button type="button" onClick={() => cargar()} disabled={cargando}>{cargando ? "Cargando…" : "Actualizar"}</button>
          <button type="button" className="ed-pdf" onClick={pdf} disabled={!resumen || haciendoPdf}>
            <Icono nombre="descargar" /> {haciendoPdf ? "Creando PDF…" : "Descargar PDF"}
          </button>
          <button type="button" onClick={descargarCsv} disabled={!resumen?.juegos.length}>
            <Icono nombre="descargar" /> Excel (CSV)
          </button>
          <button type="button" onClick={() => salir()}>Salir</button>
        </span>
      </section>

      {error && <section className="logros__seccion"><p className="cuenta__error" role="alert">{error}</p></section>}

      {opiniones && <ResumenOpiniones filas={opiniones} />}
      {!resumen && cargando && <p className="maestro__cargando" role="status">Cargando resultados…</p>}

      {resumen && (
        <>
          <section className="logros__seccion">
            <dl className="logros__cifras ed-cifras">
              <div className={nuevas ? "ed-nuevo" : undefined}>
                <dt>Respuestas</dt>
                <dd>
                  {g.total}
                  {nuevas && <small className="ed-mas" aria-hidden="true"> +{nuevas.cantidad}</small>}
                </dd>
              </div>
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
                  nuevos={nuevas?.juegos}
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
                  nuevos={nuevas?.juegos}
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

      {esSuper && (
        <section className="logros__seccion ed-tarjeta" id="cuentas" aria-labelledby="cuentas-titulo">
          <h2 id="cuentas-titulo">Cuentas de administración</h2>
          <CuentasAdmin pase={pase} onVencido={salir} />
        </section>
      )}

      {quien && (
        <section className="logros__seccion ed-tarjeta" id="mi-cuenta" aria-labelledby="mi-cuenta-titulo">
          <details>
            <summary><h2 id="mi-cuenta-titulo">Mi cuenta: cambiar mi contraseña</h2></summary>
            <MiContrasena pase={pase} onVencido={salir} />
          </details>
        </section>
      )}

      {tip && (
        <div className="ed-tip" role="tooltip" style={{ left: tip.x + 14, top: tip.y + 14 }}>
          {tip.texto}
        </div>
      )}
    </div>
  );
}
