import { useEffect, useMemo, useState } from "react";
import { ESCALA_OPINION, QUIENES } from "../data/opinion.js";
import { resumirOpiniones } from "../lib/opiniones.js";
import Icono from "./Icono.jsx";

/**
 * Administración: resultados de la evaluación abierta (/opinion). Carita promedio y barra de
 * colores de rojo a verde por pregunta, con filtro por quién contestó. Nunca dice quién fue.
 *
 * Para que la conteste más gente: QR a la vista, cartel con QR para imprimir (PDF) y la
 * dirección para abrirla en una tableta. Para presentar: reporte en PDF y Excel (CSV).
 */
const caritaDe = (promedio) => ESCALA_OPINION[Math.min(4, Math.max(0, Math.round(promedio) - 1))];
const hoy = () => new Date().toISOString().slice(0, 10);

function descargar(contenido, nombre, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** El QR de /opinion dibujado en SVG (la librería se carga aquí, no en el juego). */
function VistaQr({ direccion }) {
  const [qr, setQr] = useState(null);
  useEffect(() => {
    let vivo = true;
    import("../lib/qr.js").then(({ matrizQr, trazoQr }) => {
      if (!vivo) return;
      const m = matrizQr(direccion);
      setQr({ n: m.length, d: trazoQr(m) });
    }).catch(() => {});
    return () => { vivo = false; };
  }, [direccion]);
  if (!qr) return <div className="op-qr op-qr--cargando" aria-hidden="true" />;
  return (
    <svg className="op-qr" viewBox={`-4 -4 ${qr.n + 8} ${qr.n + 8}`} role="img" aria-label={`Código QR que abre ${direccion}`} shapeRendering="crispEdges">
      <rect x="-4" y="-4" width={qr.n + 8} height={qr.n + 8} fill="#fff" />
      <path d={qr.d} fill="#000" />
    </svg>
  );
}

export default function ResumenOpiniones({ filas, periodo = "todo" }) {
  const [quien, setQuien] = useState("todos");
  const [haciendo, setHaciendo] = useState(null);   // "cartel" | "reporte"
  const [error, setError] = useState("");
  const r = useMemo(() => resumirOpiniones(filas || [], { quien }), [filas, quien]);
  const todas = useMemo(() => resumirOpiniones(filas || []), [filas]);
  const direccion = typeof location !== "undefined" ? `${location.origin}/opinion` : "/opinion";
  const textoQuien = quien === "todos" ? "todos" : ([...QUIENES, { id: "sin", texto: "No dijo" }].find((q) => q.id === quien)?.texto || quien);

  async function pdf(tipo) {
    setHaciendo(tipo);
    setError("");
    try {
      const { crearCartel, crearReporte } = await import("../lib/pdfOpiniones.js");
      if (tipo === "cartel") (await crearCartel(direccion)).save("cartel-califica-escuadron.pdf");
      else (await crearReporte(r, { periodo, quien: textoQuien })).save(`opiniones-escuadron-${hoy()}.pdf`);
    } catch (e) {
      setError("No pude crear el PDF: " + e.message);
    } finally {
      setHaciendo(null);
    }
  }

  async function csv() {
    const { csvOpiniones } = await import("../lib/pdfOpiniones.js");
    descargar(csvOpiniones(r, { periodo, quien: textoQuien }), `opiniones-escuadron-${hoy()}.csv`, "text/csv;charset=utf-8");
  }

  return (
    <section className="logros__seccion ed-tarjeta" id="opiniones" aria-labelledby="opiniones-titulo">
      <h2 id="opiniones-titulo">
        Evaluación abierta <small>{todas.total} {todas.total === 1 ? "opinión" : "opiniones"} en el periodo · anónimas</small>
      </h2>

      <div className="op-difusion">
        <VistaQr direccion={direccion} />
        <div className="op-difusion__texto">
          <p>
            Cualquiera la contesta <strong>sin registrarse</strong>: escaneando este código, desde el botón
            «¿Qué te pareció?» de la portada o en{" "}
            <a href="/opinion" target="_blank" rel="noopener">{direccion.replace(/^https?:\/\//, "")}</a>.
          </p>
          <p className="ed-ayuda">
            Para un evento: imprime el cartel y pégalo a la vista, o abre la dirección en una tableta y toca
            «Pantalla completa»; se limpia sola para la siguiente persona.
          </p>
          <span className="ed-acciones op-difusion__botones">
            <button type="button" className="ed-pdf" onClick={() => pdf("cartel")} disabled={!!haciendo}>
              <Icono nombre="descargar" /> {haciendo === "cartel" ? "Creando cartel…" : "Cartel con QR para imprimir"}
            </button>
            <button type="button" onClick={() => pdf("reporte")} disabled={!!haciendo || !r.total}>
              <Icono nombre="descargar" /> {haciendo === "reporte" ? "Creando PDF…" : "Reporte en PDF"}
            </button>
            <button type="button" onClick={csv} disabled={!r.total}>
              <Icono nombre="descargar" /> Excel (CSV)
            </button>
          </span>
          {error && <p className="cuenta__error" role="alert">{error}</p>}
        </div>
      </div>

      {todas.total > 0 && (
        <div className="ed-filtro" role="group" aria-label="Quién contestó">
          <span className="ed-filtro__etiqueta">Quién</span>
          {[{ id: "todos", texto: "Todos", total: todas.total }, ...todas.quienes.filter((q) => q.total)].map((q) => (
            <button key={q.id} type="button" aria-pressed={quien === q.id} className={quien === q.id ? "activo" : ""} onClick={() => setQuien(q.id)}>
              {q.texto} <small>({q.total})</small>
            </button>
          ))}
        </div>
      )}

      {r.total === 0 ? (
        <p className="logros__nota">Todavía no hay opiniones en este periodo.</p>
      ) : (
        <ul className="evaluado">
          {r.preguntas.map((p) => {
            const c = caritaDe(p.promedio);
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
                  aria-label={ESCALA_OPINION.map((e, i) => `${e.etiqueta}: ${p.conteo[i]}`).join(", ")}
                >
                  {ESCALA_OPINION.map((e, i) =>
                    p.conteo[i] ? (
                      <span key={e.valor} style={{ width: `${(p.conteo[i] / r.total) * 100}%`, background: e.color }} title={`${e.emoji} ${e.etiqueta}: ${p.conteo[i]}`} />
                    ) : null
                  )}
                </span>
                <span className="evaluado__conteo" aria-hidden="true">
                  {ESCALA_OPINION.map((e, i) => <span key={e.valor}>{e.emoji} {p.conteo[i]}</span>)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
