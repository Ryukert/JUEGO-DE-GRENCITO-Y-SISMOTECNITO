/**
 * Alumnos: unirse a un grupo o volver a entrar. Sin correo ni datos personales: código del
 * grupo + apodo + PIN de 4 cifras + avatar (Tecnito o Greencito).
 *
 *   GET  /api/alumno                         → { disponible }   (¿hay base de datos?)
 *   POST /api/alumno { accion: "registrar", codigo, apodo, pin, avatar }
 *   POST /api/alumno { accion: "entrar",    codigo, apodo, pin }
 *     → { pase, alumno: { id, apodo, avatar }, grupo: { codigo, nombre, grado }, progreso }
 *
 * El pase se manda después en Authorization: Bearer … a /api/progreso.
 */
import { db, eq, ErrorDb, configuracionDb } from "./_db.js";
import {
  responderJson, quienEs, leerCuerpo, secreto, crearPase,
  resumirClave, claveCorrecta, limpiarApodo, pinValido, limpiarCodigo,
} from "./_comun.js";
import { revisarIntentos } from "./_limites.js";
import { limpiarProgreso } from "../src/lib/mezcla.js";

const AVATARES = ["sismo", "green"];
const SIN_PASAR = "Apodo o PIN incorrectos. Si no te acuerdas, pídele a tu maestro que te ponga otro PIN.";

export const baseLista = (env = process.env) => !!(configuracionDb(env) && secreto(env));

async function buscarGrupo(codigo) {
  const filas = await db(`grupos?codigo=${eq(codigo)}&select=id,codigo,nombre,grado`);
  return filas?.[0] || null;
}

export default async function handler(req, res) {
  if (req.method === "GET") return responderJson(res, 200, { disponible: baseLista() });
  if (req.method !== "POST") return responderJson(res, 405, { error: "Usa POST" }, { Allow: "GET, POST" });
  if (!baseLista()) return responderJson(res, 503, { error: "Los grupos no están disponibles ahorita." });

  let d;
  try { d = await leerCuerpo(req, 4_000); }
  catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }

  const codigo = limpiarCodigo(d?.codigo);
  if (!codigo) return responderJson(res, 400, { error: "El código del grupo tiene 6 letras y números." });
  const apodo = limpiarApodo(d?.apodo);
  if (!apodo) return responderJson(res, 400, { error: "El apodo lleva de 2 a 20 letras o números." });
  if (!pinValido(d?.pin)) return responderJson(res, 400, { error: "El PIN son 4 números." });
  if (d.accion !== "registrar" && d.accion !== "entrar") return responderJson(res, 400, { error: "Acción desconocida" });

  const tope = await revisarIntentos(quienEs(req), `alumno|${codigo}|${apodo.normal}`);
  if (tope) {
    return responderJson(res, 429, { error: "Demasiados intentos. Espera un rato o pídele ayuda a tu maestro." }, { "Retry-After": "600" });
  }

  try {
    const grupo = await buscarGrupo(codigo);
    if (!grupo) return responderJson(res, 404, { error: "No encontré ese código de grupo. Revísalo con tu maestro." });

    let alumno, progreso = limpiarProgreso({ grado: grupo.grado });

    if (d.accion === "registrar") {
      const avatar = AVATARES.includes(d.avatar) ? d.avatar : "sismo";
      try {
        [alumno] = await db("alumnos?select=id,apodo,avatar", {
          metodo: "POST",
          devolver: true,
          cuerpo: { grupo_id: grupo.id, apodo: apodo.visible, apodo_normal: apodo.normal, avatar, pin: resumirClave(d.pin) },
        });
      } catch (e) {
        if (e instanceof ErrorDb && e.codigo === "23505") {
          return responderJson(res, 409, { error: "Ese apodo ya está en el grupo. Si es tuyo, entra con tu PIN; si no, elige otro." });
        }
        throw e;
      }
      await db("progreso", { metodo: "POST", cuerpo: { alumno_id: alumno.id, datos: progreso } });
    } else {
      const filas = await db(`alumnos?grupo_id=${eq(grupo.id)}&apodo_normal=${eq(apodo.normal)}&select=id,apodo,avatar,pin`);
      const fila = filas?.[0];
      if (!fila || !claveCorrecta(d.pin, fila.pin)) return responderJson(res, 401, { error: SIN_PASAR });
      alumno = { id: fila.id, apodo: fila.apodo, avatar: fila.avatar };
      const [guardado] = await db(`progreso?alumno_id=${eq(alumno.id)}&select=datos`);
      if (guardado) progreso = limpiarProgreso(guardado.datos);
      await db(`alumnos?id=${eq(alumno.id)}`, { metodo: "PATCH", cuerpo: { ultima_vez: new Date().toISOString() } });
    }

    const pase = crearPase({ rol: "alumno", a: alumno.id, g: grupo.id });
    return responderJson(res, 200, {
      pase,
      alumno,
      grupo: { codigo: grupo.codigo, nombre: grupo.nombre, grado: grupo.grado },
      progreso,
    });
  } catch (e) {
    console.error("[alumno]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude conectar con el grupo ahorita. Puedes jugar sin entrar." });
  }
}
