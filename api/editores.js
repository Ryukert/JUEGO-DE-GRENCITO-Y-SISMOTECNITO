/**
 * Ventana de editores: resultados de las encuestas de satisfacción de los juegos.
 *
 *   POST /api/editores { clave }                      → { pase }       (dura 8 horas)
 *   GET  /api/editores?desde=AAAA-MM-DD&hasta=…  (pase de editor)
 *     → { filas: [{ juego, tipo, grado, dia, gusto, dificultad, respuestas }] }
 *
 * Las filas ya vienen resumidas (cuántas respuestas por juego, grado, día, carita y dificultad):
 * nunca dicen quién contestó. Se leen con la llave secreta si está; si no, con la función
 * public.resumen_encuestas (llave publicable + llave de la API derivada de JUEGO_SECRETO).
 *
 * Variable requerida: EDITORES_CLAVE (la clave que escriben los editores, 10 caracteres o más).
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { db, configuracionDb, configuracionRpc, rpc } from "./_db.js";
import { responderJson, quienEs, leerCuerpo, crearPase, paseDe, secreto } from "./_comun.js";
import { revisarIntentos } from "./_limites.js";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const resumen = (t) => createHash("sha256").update(String(t)).digest();

export function claveEditorCorrecta(clave, env = process.env) {
  const real = env.EDITORES_CLAVE;
  if (typeof real !== "string" || real.length < 10 || typeof clave !== "string") return false;
  return timingSafeEqual(resumen(clave), resumen(real));
}

/** Filas crudas de la tabla → el mismo resumen que da la función de Supabase. */
export function agrupar(crudas, zona = "America/Tijuana") {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" });
  const mapa = new Map();
  for (const e of crudas) {
    const dia = fmt.format(new Date(e.creado_en));
    const k = [e.juego, e.tipo, e.grado, dia, e.gusto, e.dificultad].join("|");
    const v = mapa.get(k) || { juego: e.juego, tipo: e.tipo, grado: e.grado, dia, gusto: e.gusto, dificultad: e.dificultad, respuestas: 0 };
    v.respuestas += 1;
    mapa.set(k, v);
  }
  return [...mapa.values()];
}

export default async function handler(req, res) {
  if (!secreto() || !(configuracionDb() || configuracionRpc())) {
    return responderJson(res, 503, { error: "La ventana de editores no está configurada en el servidor." });
  }
  if (!process.env.EDITORES_CLAVE) return responderJson(res, 503, { error: "Falta EDITORES_CLAVE en el servidor." });

  if (req.method === "POST") {
    if (await revisarIntentos(quienEs(req), "editores")) {
      return responderJson(res, 429, { error: "Demasiados intentos. Espera un rato." }, { "Retry-After": "600" });
    }
    let d;
    try { d = await leerCuerpo(req, 1_000); }
    catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }
    if (!claveEditorCorrecta(d?.clave)) return responderJson(res, 401, { error: "Clave incorrecta." });
    return responderJson(res, 200, { pase: crearPase({ rol: "editor" }) });
  }

  if (req.method !== "GET") return responderJson(res, 405, { error: "Usa GET o POST" }, { Allow: "GET, POST" });
  if (!paseDe(req, "editor")) return responderJson(res, 401, { error: "Vuelve a escribir la clave de editores." });

  const url = new URL(req.url || "/", "http://x");
  const desde = FECHA.test(url.searchParams.get("desde") || "") ? url.searchParams.get("desde") : null;
  const hasta = FECHA.test(url.searchParams.get("hasta") || "") ? url.searchParams.get("hasta") : null;

  try {
    let filas;
    if (configuracionRpc()) {
      filas = await rpc("resumen_encuestas", { p_desde: desde, p_hasta: hasta });
    } else {
      const filtros = [desde && `creado_en=gte.${desde}T00:00:00-08:00`, hasta && `creado_en=lte.${hasta}T23:59:59-08:00`].filter(Boolean).join("&");
      const crudas = await db(`encuestas?select=juego,tipo,grado,gusto,dificultad,creado_en&limit=100000${filtros ? "&" + filtros : ""}`);
      filas = agrupar(crudas || []);
    }
    return responderJson(res, 200, { filas: (filas || []).map((f) => ({ ...f, respuestas: Number(f.respuestas) })) });
  } catch (e) {
    console.error("[editores]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude leer las encuestas ahorita." });
  }
}
