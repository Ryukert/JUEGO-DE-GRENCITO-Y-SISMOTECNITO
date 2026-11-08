/**
 * Progreso del alumno en la base de datos (necesita el pase de /api/alumno).
 *
 *   GET /api/progreso                         → { progreso, alumno, grupo }
 *   PUT /api/progreso { progreso, respuestas } → { progreso }
 *
 * El servidor no reemplaza lo guardado: lo combina con lo que llega (src/lib/mezcla.js), así
 * que un equipo con datos viejos no borra lo que se ganó en otro.
 *
 * respuestas: [{ personaje, grado, mision, bono, eleccion }]: lo que eligió el alumno en cada
 * pregunta (eleccion null = se acabó el tiempo). Si fue correcta lo decide el servidor con el
 * contenido del juego; lo que no exista en el juego se ignora.
 */
import { db, eq, configuracionDb } from "./_db.js";
import { responderJson, quienEs, leerCuerpo, paseDe, secreto } from "./_comun.js";
import { revisarEscrituras } from "./_limites.js";
import { mezclarProgreso, limpiarProgreso } from "../src/lib/mezcla.js";
import { PERSONAJES, GRADOS } from "../src/data/personajes.js";

const MAX_RESPUESTAS = 60;
const tiene = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

/** { personaje, grado, mision, bono, eleccion } → fila para la tabla, o null si no es del juego. */
export function calificar(r) {
  if (!r || typeof r !== "object") return null;
  const p = tiene(PERSONAJES, r.personaje) ? PERSONAJES[r.personaje] : null;
  const grado = tiene(GRADOS, r.grado) ? r.grado : null;
  const mision = p?.misiones.find((m) => m.id === r.mision && m.tipo === "reto");
  if (!p || !grado || !mision) return null;
  const bono = r.bono === true;
  if (bono && !(GRADOS[grado].retoExtra && mision.retoSecundaria)) return null;
  const opciones = bono
    ? mision.retoSecundaria.opciones
    : mision.opciones.concat(GRADOS[grado].opcionExtra && mision.opcionExtra ? [mision.opcionExtra] : []);
  if (r.eleccion === null || r.eleccion === undefined) {
    return { personaje: p.id, mision: mision.id, bono, correcta: false, sin_tiempo: true };
  }
  const opcion = opciones.find((o) => o.texto === r.eleccion);
  if (!opcion) return null;
  return { personaje: p.id, mision: mision.id, bono, correcta: !!opcion.ok, sin_tiempo: false };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") return responderJson(res, 405, { error: "Usa GET o PUT" }, { Allow: "GET, PUT" });
  if (!configuracionDb() || !secreto()) return responderJson(res, 503, { error: "Los grupos no están disponibles ahorita." });

  const pase = paseDe(req, "alumno");
  if (!pase) return responderJson(res, 401, { error: "Vuelve a entrar con tu apodo y PIN." });

  try {
    // el maestro pudo haber quitado al alumno: entonces el pase ya no sirve
    const [alumno] = await db(`alumnos?id=${eq(pase.a)}&grupo_id=${eq(pase.g)}&select=id,apodo,avatar,grupos(codigo,nombre,grado)`);
    if (!alumno) return responderJson(res, 401, { error: "Tu maestro te quitó del grupo o el grupo ya no existe." });
    const [guardado] = await db(`progreso?alumno_id=${eq(pase.a)}&select=datos`);
    const antes = limpiarProgreso(guardado?.datos);

    if (req.method === "GET") {
      const g = alumno.grupos || {};
      return responderJson(res, 200, {
        progreso: antes,
        alumno: { id: alumno.id, apodo: alumno.apodo, avatar: alumno.avatar },
        grupo: { codigo: g.codigo, nombre: g.nombre, grado: g.grado },
      });
    }

    if (await revisarEscrituras(quienEs(req))) {
      return responderJson(res, 429, { error: "Demasiados guardados seguidos." }, { "Retry-After": "60" });
    }

    let d;
    try { d = await leerCuerpo(req); }
    catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }

    const progreso = d?.progreso ? mezclarProgreso(antes, d.progreso) : antes;
    const ahora = new Date().toISOString();
    await db("progreso?on_conflict=alumno_id", {
      metodo: "POST",
      unir: true,
      cuerpo: { alumno_id: pase.a, datos: progreso, actualizado_en: ahora },
    });

    const filas = (Array.isArray(d?.respuestas) ? d.respuestas.slice(0, MAX_RESPUESTAS) : [])
      .map(calificar)
      .filter(Boolean)
      .map((f) => ({ ...f, alumno_id: pase.a, grupo_id: pase.g }));
    if (filas.length) await db("respuestas", { metodo: "POST", cuerpo: filas });

    await db(`alumnos?id=${eq(pase.a)}`, { metodo: "PATCH", cuerpo: { ultima_vez: ahora } });
    return responderJson(res, 200, { progreso, guardadas: filas.length });
  } catch (e) {
    console.error("[progreso]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude guardar en el grupo ahorita. Lo intento después." });
  }
}
