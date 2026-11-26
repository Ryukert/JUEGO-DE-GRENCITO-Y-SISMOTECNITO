/**
 * Contador de visitas del sitio.
 *
 *   POST /api/visita          → { total }        suma una visita a hoy (la página manda una por
 *                                                 navegador al día)
 *   GET  /api/visita          → { total, hoy }   lo que muestra la portada
 *   GET  /api/visita (pase de editor) → { total, hoy, dias: [{ dia, visitas }] }   la administración
 *
 * No se guarda nada de quién entró: solo cuántas visitas hubo cada día. Los buscadores y
 * robots no cuentan. Topes para que nadie infle el número: 300 por hora por IP (una escuela
 * entera sale por la misma IP) y 100,000 al día en total; pasado el tope responde el total sin
 * sumar.
 *
 * Funciona con la llave publicable o con la secreta: en los dos casos usa las funciones
 * public.sumar_visita y public.visitas_por_dia (supabase/migrations/20261127010000_visitas.sql),
 * que piden la «llave de la API» (derivada de JUEGO_SECRETO).
 */
import { db, configuracionDb, configuracionRpc, rpc, llaveApi } from "./_db.js";
import { responderJson, quienEs, paseDe, secreto } from "./_comun.js";
import { contar, resumen } from "./_limites.js";

const ROBOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime/i;
const zona = () => process.env.EVALUACION_ZONA || "America/Tijuana";

/** Llama a la función con la llave que haya (la publicable o la secreta). */
async function funcion(nombre) {
  if (configuracionRpc()) return rpc(nombre, {});
  return db(`rpc/${nombre}`, { metodo: "POST", cuerpo: { p_llave: llaveApi(secreto()) } });
}

const disponible = () => !!(configuracionRpc() || (configuracionDb() && secreto()));

/** AAAA-MM-DD de hoy en la zona del juego. */
export const hoyEn = (tz = zona(), ahora = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return responderJson(res, 405, { error: "Usa GET o POST" }, { Allow: "GET, POST" });
  if (!disponible()) return responderJson(res, 503, { error: "El contador no está disponible." });

  try {
    if (req.method === "POST") {
      if (ROBOT.test(String(req.headers["user-agent"] || ""))) return responderJson(res, 200, { contada: false });
      const hora = Math.floor(Date.now() / 3_600_000);
      const dia = Math.floor(Date.now() / 86_400_000);
      const tope = await contar([
        { clave: `visita:${resumen("ip", quienEs(req))}:${hora}`, segundos: 4_000, max: 300, motivo: "ip" },
        { clave: `visita-total:${dia}`, segundos: 90_000, max: 100_000, motivo: "dia" },
      ]);
      if (!tope) return responderJson(res, 200, { total: Number(await funcion("sumar_visita")), contada: true });
      // pasado el tope no suma, pero la portada sigue mostrando el número
    }

    const dias = ((await funcion("visitas_por_dia")) || []).map((d) => ({ dia: d.dia, visitas: Number(d.visitas) }));
    const total = dias.reduce((s, d) => s + d.visitas, 0);
    const hoy = dias.find((d) => d.dia === hoyEn())?.visitas || 0;
    if (req.method === "GET" && paseDe(req, "editor")) return responderJson(res, 200, { total, hoy, dias });
    // el número de la portada: puede tener un minuto de atraso, así no se pide en cada visita
    return responderJson(res, 200, { total, hoy }, req.method === "GET" ? { "Cache-Control": "public, max-age=0, s-maxage=60" } : {});
  } catch (e) {
    console.error("[visita]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude leer el contador ahorita." });
  }
}
