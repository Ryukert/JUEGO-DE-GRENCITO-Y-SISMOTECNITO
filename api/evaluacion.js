/**
 * El alumno evalúa a su maestro con caritas (necesita el pase de /api/alumno).
 *
 *   GET  /api/evaluacion                          → { hoy: { explica, divierte, aprendo } | null }
 *   POST /api/evaluacion { explica, divierte, aprendo }   (1 = 😡 … 5 = 😄) → { ok }
 *
 * Una por alumno al día (si la repite, se actualiza). El día se cuenta con la hora de
 * EVALUACION_ZONA (por omisión America/Tijuana), no con la del servidor.
 * El maestro ve solo promedios en /api/grupo, nunca quién votó qué.
 */
import { db, eq, configuracionDb } from "./_db.js";
import { responderJson, quienEs, leerCuerpo, paseDe, secreto } from "./_comun.js";
import { revisarEscrituras } from "./_limites.js";
import { PREGUNTAS, valorValido } from "../src/data/evaluacion.js";

export function hoyEn(zona = process.env.EVALUACION_ZONA || "America/Tijuana", ahora = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
  } catch {
    return ahora.toISOString().slice(0, 10);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return responderJson(res, 405, { error: "Usa GET o POST" }, { Allow: "GET, POST" });
  if (!configuracionDb() || !secreto()) return responderJson(res, 503, { error: "Los grupos no están disponibles ahorita." });
  const pase = paseDe(req, "alumno");
  if (!pase) return responderJson(res, 401, { error: "Entra a tu grupo para evaluar a tu maestro." });

  try {
    const fecha = hoyEn();
    const campos = PREGUNTAS.map((p) => p.id).join(",");
    if (req.method === "GET") {
      const [fila] = await db(`evaluaciones?alumno_id=${eq(pase.a)}&fecha=${eq(fecha)}&select=${campos}`);
      return responderJson(res, 200, { hoy: fila ? Object.fromEntries(PREGUNTAS.map((p) => [p.id, fila[p.id]])) : null });
    }

    if (await revisarEscrituras(quienEs(req))) return responderJson(res, 429, { error: "Espera un momento." }, { "Retry-After": "60" });
    let d;
    try { d = await leerCuerpo(req, 2_000); }
    catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }
    const valores = {};
    for (const p of PREGUNTAS) {
      if (!valorValido(d?.[p.id])) return responderJson(res, 400, { error: "Elige una carita en cada pregunta." });
      valores[p.id] = d[p.id];
    }

    // el alumno sigue en el grupo (el maestro pudo haberlo quitado)
    const [alumno] = await db(`alumnos?id=${eq(pase.a)}&grupo_id=${eq(pase.g)}&select=id`);
    if (!alumno) return responderJson(res, 401, { error: "Ya no estás en ese grupo." });

    await db("evaluaciones?on_conflict=alumno_id,fecha", {
      metodo: "POST",
      unir: true,
      cuerpo: { grupo_id: pase.g, alumno_id: pase.a, fecha, ...valores, creado_en: new Date().toISOString() },
    });
    return responderJson(res, 200, { ok: true });
  } catch (e) {
    console.error("[evaluacion]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude guardar tu evaluación ahorita. Inténtalo más tarde." });
  }
}
