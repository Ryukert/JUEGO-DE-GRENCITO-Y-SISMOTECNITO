import { useMemo, useState } from "react";
import { ESCALA_OPINION } from "../data/opinion.js";
import { resumirOpiniones } from "../lib/opiniones.js";

/**
 * Administración: resultados de la evaluación abierta (/opinion). Carita promedio y barra de
 * colores de rojo a verde por pregunta, con filtro por quién contestó. Nunca dice quién fue.
 */
const caritaDe = (promedio) => ESCALA_OPINION[Math.min(4, Math.max(0, Math.round(promedio) - 1))];

export default function ResumenOpiniones({ filas }) {
  const [quien, setQuien] = useState("todos");
  const r = useMemo(() => resumirOpiniones(filas || [], { quien }), [filas, quien]);
  const todas = useMemo(() => resumirOpiniones(filas || []), [filas]);
  const enlace = typeof location !== "undefined" ? `${location.origin}/opinion` : "/opinion";

  return (
    <section className="logros__seccion ed-tarjeta" id="opiniones" aria-labelledby="opiniones-titulo">
      <h2 id="opiniones-titulo">
        Evaluación abierta <small>{todas.total} {todas.total === 1 ? "opinión" : "opiniones"} en el periodo · anónimas</small>
      </h2>
      <p className="logros__nota">
        Cualquiera la contesta sin registrarse en <a href="/opinion" target="_blank" rel="noopener">{enlace.replace(/^https?:\/\//, "")}</a>{" "}
        (también desde el botón «¿Qué te pareció?» de la portada). Se puede dejar abierta en una tableta.
      </p>

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
