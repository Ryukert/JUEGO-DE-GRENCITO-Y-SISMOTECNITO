import { useMemo } from "react";
import { hoyTijuana } from "../lib/opiniones.js";

/**
 * Administración: visitas al sitio (lo que cuenta /api/visita). Hoy, últimos 7 y 30 días, el
 * total, y una barra por día de los últimos 30. No dice quién entró: solo cuántos.
 */
const DIAS_GRAFICA = 30;

/** Los últimos n días (AAAA-MM-DD) que terminan en «hoy», del más viejo al más nuevo. */
function ultimosDias(hoy, n) {
  const [a, m, d] = hoy.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(a, m - 1, d - (n - 1 - i))).toISOString().slice(0, 10));
}

const n = (x) => x.toLocaleString("es-MX");
const fecha = (dia, op) => new Date(dia + "T12:00:00Z").toLocaleDateString("es-MX", { timeZone: "UTC", ...op });

export function resumirVisitas(dias, { hoy = hoyTijuana() } = {}) {
  const por = new Map(dias.map((d) => [d.dia, d.visitas]));
  const serie = ultimosDias(hoy, DIAS_GRAFICA).map((dia) => ({ dia, visitas: por.get(dia) || 0 }));
  const suma = (k) => serie.slice(-k).reduce((s, d) => s + d.visitas, 0);
  return {
    hoy: por.get(hoy) || 0,
    semana: suma(7),
    mes: suma(30),
    total: dias.reduce((s, d) => s + d.visitas, 0),
    desde: dias[0]?.dia || null,
    serie,
  };
}

export default function ResumenVisitas({ datos }) {
  const r = useMemo(() => resumirVisitas(datos.dias || []), [datos]);
  const max = Math.max(1, ...r.serie.map((d) => d.visitas));
  return (
    <section className="logros__seccion ed-tarjeta" id="visitas" aria-labelledby="visitas-titulo">
      <h2 id="visitas-titulo">
        Visitas al sitio <small>{r.desde ? `desde el ${fecha(r.desde, { day: "numeric", month: "long", year: "numeric" })}` : "todavía no hay"} · una por navegador al día</small>
      </h2>
      <dl className="logros__cifras ed-cifras">
        <div><dt>Hoy</dt><dd>{n(r.hoy)}</dd></div>
        <div><dt>Últimos 7 días</dt><dd>{n(r.semana)}</dd></div>
        <div><dt>Últimos 30 días</dt><dd>{n(r.mes)}</dd></div>
        <div><dt>Total</dt><dd>{n(r.total)}</dd></div>
      </dl>
      <div
        className="vis-grafica" role="img"
        aria-label={`Visitas por día, últimos ${DIAS_GRAFICA} días: ` + r.serie.filter((d) => d.visitas).map((d) => `${fecha(d.dia, { day: "numeric", month: "short" })}: ${d.visitas}`).join(", ")}
      >
        {r.serie.map((d) => (
          <span key={d.dia} className="vis-grafica__dia" title={`${fecha(d.dia, { weekday: "short", day: "numeric", month: "short" })}: ${n(d.visitas)}`}>
            <span className="vis-grafica__barra" style={{ height: d.visitas ? `max(2px, ${(d.visitas / max) * 100}%)` : 0 }} />
          </span>
        ))}
      </div>
      <p className="vis-grafica__eje" aria-hidden="true">
        <span>{fecha(r.serie[0].dia, { day: "numeric", month: "short" })}</span>
        <span>máx. {n(max)} en un día</span>
        <span>hoy</span>
      </p>
    </section>
  );
}
