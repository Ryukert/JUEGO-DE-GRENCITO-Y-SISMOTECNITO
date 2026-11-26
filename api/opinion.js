/**
 * Evaluación abierta (/opinion): cualquiera califica con caritas, sin cuenta.
 *
 *   POST /api/opinion { juego, trato, explicacion: 1-5, quien?: "alumno" | "maestro" | "familia" | "otro",
 *                       evento?: "feria-de-ciencias" }   (de /opinion?evento=…; sin él, la general)
 *     → { ok }
 *   GET  /api/opinion?desde=AAAA-MM-DD&hasta=…   (pase de editor: la administración)
 *     → { filas: [{ dia, evento, quien, juego, trato, explicacion, respuestas }] }
 *
 * No se guarda quién contestó (ni IP, ni alumno). Topes para que nadie llene la tabla: 120
 * opiniones por hora por IP (una tableta en un evento, o un salón entero, sale por la misma IP)
 * y 5,000 al día en total. Pasado el tope responde 429.
 *
 * Funciona con la llave secreta o, sin ella, con la publicable + JUEGO_SECRETO a través de
 * public.registrar_opinion y public.resumen_opiniones (supabase/migrations/20261126020000_opiniones.sql).
 */
import { db, configuracionDb, configuracionRpc, rpc } from "./_db.js";
import { responderJson, quienEs, leerCuerpo, paseDe } from "./_comun.js";
import { contar, resumen } from "./_limites.js";
import { opinionValida, PREGUNTAS_OPINION } from "../src/data/opinion.js";
import { inicioDelDia } from "./editores.js";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const disponible = () => !!(configuracionDb() || configuracionRpc());
const zona = () => process.env.EVALUACION_ZONA || "America/Tijuana";

/** Filas crudas → el mismo resumen que da public.resumen_opiniones. */
export function agruparOpiniones(crudas, tz = "America/Tijuana") {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  const mapa = new Map();
  for (const o of crudas) {
    const dia = fmt.format(new Date(o.creado_en));
    const fila = { dia, evento: o.evento ?? null, quien: o.quien ?? null, ...Object.fromEntries(PREGUNTAS_OPINION.map((p) => [p.id, o[p.id]])) };
    const k = JSON.stringify(fila);
    const v = mapa.get(k) || { ...fila, respuestas: 0 };
    v.respuestas += 1;
    mapa.set(k, v);
  }
  return [...mapa.values()];
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return responderJson(res, 405, { error: "Usa GET o POST" }, { Allow: "GET, POST" });
  if (!disponible()) return responderJson(res, 503, { error: "Las opiniones no están disponibles ahorita." });

  if (req.method === "GET") {
    if (!paseDe(req, "editor")) return responderJson(res, 401, { error: "Vuelve a entrar a la administración." });
    const url = new URL(req.url || "/", "http://x");
    const desde = FECHA.test(url.searchParams.get("desde") || "") ? url.searchParams.get("desde") : null;
    const hasta = FECHA.test(url.searchParams.get("hasta") || "") ? url.searchParams.get("hasta") : null;
    try {
      let filas;
      if (configuracionRpc()) {
        filas = await rpc("resumen_opiniones", { p_desde: desde, p_hasta: hasta });
      } else {
        const filtros = [
          desde && `creado_en=gte.${encodeURIComponent(inicioDelDia(desde, zona()))}`,
          hasta && `creado_en=lt.${encodeURIComponent(inicioDelDia(hasta, zona(), { siguiente: true }))}`,
        ].filter(Boolean).join("&");
        const campos = ["evento", "quien", "creado_en", ...PREGUNTAS_OPINION.map((p) => p.id)].join(",");
        filas = agruparOpiniones(await db(`opiniones?select=${campos}&limit=100000${filtros ? "&" + filtros : ""}`) || [], zona());
      }
      return responderJson(res, 200, { filas: (filas || []).map((f) => ({ ...f, evento: f.evento ?? null, respuestas: Number(f.respuestas) })) });
    } catch (e) {
      console.error("[opinion]", e.estado || "", e.codigo || "", e.message);
      return responderJson(res, 502, { error: "No pude leer las opiniones ahorita." });
    }
  }

  let d;
  try { d = await leerCuerpo(req, 1_000); }
  catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }
  if (!opinionValida(d)) return responderJson(res, 400, { error: "Toca una carita en cada pregunta." });

  const hora = Math.floor(Date.now() / 3_600_000);
  const dia = Math.floor(Date.now() / 86_400_000);
  const tope = await contar([
    { clave: `opinion:${resumen("ip", quienEs(req))}:${hora}`, segundos: 4_000, max: 120, motivo: "ip" },
    { clave: `opinion-total:${dia}`, segundos: 90_000, max: 5_000, motivo: "dia" },
  ]);
  if (tope) return responderJson(res, 429, { error: "Recibimos muchas opiniones seguidas. Intenta en un rato. ¡Gracias!" }, { "Retry-After": "600" });

  const valores = Object.fromEntries(PREGUNTAS_OPINION.map((p) => [p.id, d[p.id]]));
  const quien = d.quien ?? null;
  const evento = d.evento ?? null;
  try {
    if (configuracionDb()) {
      await db("opiniones", { metodo: "POST", cuerpo: { ...valores, quien, evento } });
    } else {
      await rpc("registrar_opinion", { p_juego: valores.juego, p_trato: valores.trato, p_explicacion: valores.explicacion, p_quien: quien, p_evento: evento });
    }
    return responderJson(res, 200, { ok: true });
  } catch (e) {
    console.error("[opinion]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude guardar tu opinión ahorita." });
  }
}
