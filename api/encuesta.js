/**
 * Encuesta de satisfacción al terminar un juego.
 *
 *   POST /api/encuesta { juego, tipo: "minijuego" | "mision", gusto: 1-5, dificultad: 1-3, grado }
 *     → { ok }
 *
 * Se puede contestar sin cuenta. Si llega el pase del alumno (Authorization: Bearer …), la
 * respuesta se liga a su grupo para el panel del maestro, que solo ve promedios por juego.
 * Tope: 40 encuestas por hora por IP (un salón entero sale por la misma IP).
 *
 * Funciona con la llave secreta (SUPABASE_SECRET_KEY) o, si no está, con la publicable
 * (SUPABASE_PUBLISHABLE_KEY) + JUEGO_SECRETO a través de public.registrar_encuesta.
 */
import { db, eq, configuracionDb, configuracionRpc, rpc } from "./_db.js";
import { responderJson, quienEs, leerCuerpo, paseDe } from "./_comun.js";
import { contar, resumen } from "./_limites.js";
import { encuestaValida } from "../src/data/evaluacion.js";

const disponibles = () => !!(configuracionDb() || configuracionRpc());

export default async function handler(req, res) {
  if (req.method === "GET") return responderJson(res, 200, { disponible: disponibles() });
  if (req.method !== "POST") return responderJson(res, 405, { error: "Usa POST" }, { Allow: "GET, POST" });
  if (!disponibles()) return responderJson(res, 503, { error: "Las encuestas no están disponibles ahorita." });

  let d;
  try { d = await leerCuerpo(req, 1_000); }
  catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }
  if (!encuestaValida(d)) return responderJson(res, 400, { error: "Elige una carita en cada pregunta." });

  const hora = Math.floor(Date.now() / 3_600_000);
  const tope = await contar([{ clave: `encuesta:${resumen("ip", quienEs(req))}:${hora}`, segundos: 4_000, max: 40, motivo: "hora" }]);
  if (tope) return responderJson(res, 429, { error: "Ya contestaste muchas encuestas. ¡Gracias!" }, { "Retry-After": "3600" });

  try {
    let grupo_id = null, alumno_id = null;
    const pase = paseDe(req, "alumno");
    const grado = d.grado === "primaria" || d.grado === "secundaria" ? d.grado : null;

    // sin llave secreta: la función de Supabase revisa la llave de la API y si el alumno es del grupo
    if (!configuracionDb()) {
      await rpc("registrar_encuesta", {
        p_juego: d.juego, p_tipo: d.tipo, p_gusto: d.gusto, p_dificultad: d.dificultad,
        p_grado: grado, p_alumno: pase?.a || null, p_grupo: pase?.g || null,
      });
      return responderJson(res, 200, { ok: true });
    }

    if (pase) {
      const [alumno] = await db(`alumnos?id=${eq(pase.a)}&grupo_id=${eq(pase.g)}&select=id`);
      if (alumno) ({ grupo_id, alumno_id } = { grupo_id: pase.g, alumno_id: pase.a });
    }
    await db("encuestas", {
      metodo: "POST",
      cuerpo: {
        juego: d.juego,
        tipo: d.tipo,
        gusto: d.gusto,
        dificultad: d.dificultad,
        grado,
        grupo_id,
        alumno_id,
      },
    });
    return responderJson(res, 200, { ok: true });
  } catch (e) {
    console.error("[encuesta]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude guardar tu opinión ahorita." });
  }
}
