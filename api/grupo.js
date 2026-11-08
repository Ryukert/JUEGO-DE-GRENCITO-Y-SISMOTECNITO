/**
 * Grupos y panel del maestro.
 *
 *   POST /api/grupo { accion: "crear",  nombre, grado, clave } → { pase, grupo }
 *   POST /api/grupo { accion: "entrar", codigo, clave }        → { pase, grupo }
 *   GET  /api/grupo                         (pase de maestro)  → { grupo, alumnos, preguntas }
 *   POST /api/grupo { accion: "pin",    alumno, pin }  (pase)  → { ok }   ← el alumno olvidó su PIN
 *   POST /api/grupo { accion: "quitar", alumno }       (pase)  → { ok }
 *
 * La clave del maestro se guarda resumida (scrypt). El pase del maestro dura 12 horas.
 */
import { db, eq, ErrorDb, configuracionDb } from "./_db.js";
import {
  responderJson, quienEs, leerCuerpo, secreto, crearPase, paseDe,
  resumirClave, claveCorrecta, pinValido, claveValida, nuevoCodigo, limpiarCodigo,
} from "./_comun.js";
import { revisarIntentos, anotarFallo } from "./_limites.js";
import { limpiarProgreso } from "../src/lib/mezcla.js";
import { PERSONAJES, GRADOS } from "../src/data/personajes.js";
import { PREGUNTAS as PREGUNTAS_EVAL, MINIMO_ANONIMO } from "../src/data/evaluacion.js";
import { hoyEn } from "./evaluacion.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mal = (res, error, codigo = 400) => responderJson(res, codigo, { error });

/** Lo que el maestro ve de cada alumno, a partir de su progreso. */
export function resumenAlumno(datos) {
  const p = limpiarProgreso(datos);
  return {
    xp: p.xp,
    records: p.records,
    mejor: Math.max(p.records.sismo, p.records.green),
    partidas: p.partidas,
    misiones: p.insignias.length,
    minijuegos: Object.values(p.juegos).filter((j) => j.partidas > 0).length,
    logros: p.logros.length,
  };
}

/** Junta las respuestas por pregunta y por alumno. */
export function resumirRespuestas(filas) {
  const porPregunta = new Map();
  const porAlumno = {};
  for (const r of filas) {
    const clave = `${r.personaje}|${r.mision}|${r.bono ? 1 : 0}`;
    const v = porPregunta.get(clave) || { personaje: r.personaje, mision: r.mision, bono: !!r.bono, total: 0, fallos: 0 };
    v.total += 1;
    if (!r.correcta) v.fallos += 1;
    porPregunta.set(clave, v);
    const a = (porAlumno[r.alumno_id] ||= { total: 0, aciertos: 0 });
    a.total += 1;
    if (r.correcta) a.aciertos += 1;
  }
  const preguntas = [...porPregunta.values()].map((v) => {
    const mision = PERSONAJES[v.personaje]?.misiones.find((m) => m.id === v.mision);
    return {
      ...v,
      titulo: mision?.titulo || v.mision,
      pregunta: v.bono ? mision?.retoSecundaria?.pregunta || "" : mision?.escenario || "",
    };
  });
  preguntas.sort((a, b) => b.fallos / b.total - a.fallos / a.total || b.total - a.total);
  return { preguntas, porAlumno };
}

/**
 * Promedio y conteo de caritas por pregunta. Recibe filas SIN alumno: el maestro nunca sabe quién
 * votó. Con menos de MINIMO_ANONIMO evaluaciones no se muestra nada (se adivinaría quién fue).
 */
export function resumirEvaluaciones(filas, { hoy = new Date().toISOString().slice(0, 10) } = {}) {
  const total = filas.length;
  const haceSemana = new Date(new Date(hoy + "T12:00:00Z").getTime() - 6 * 86_400_000).toISOString().slice(0, 10);
  const semana = filas.filter((f) => f.fecha >= haceSemana).length;
  if (total < MINIMO_ANONIMO) return { total, semana, suficientes: false, preguntas: [] };
  return {
    total,
    semana,
    suficientes: true,
    preguntas: PREGUNTAS_EVAL.map((p) => {
      const conteo = [0, 0, 0, 0, 0];
      let suma = 0;
      for (const f of filas) {
        const v = f[p.id];
        if (v >= 1 && v <= 5) { conteo[v - 1] += 1; suma += v; }
      }
      return { id: p.id, texto: p.corto, promedio: Math.round((suma / total) * 10) / 10, conteo };
    }),
  };
}

/** Encuestas de los juegos por juego: cuántas, promedio de «¿te gustó?» y reparto de dificultad. */
export function resumirEncuestas(filas) {
  const porJuego = new Map();
  for (const f of filas) {
    const v = porJuego.get(f.juego) || { juego: f.juego, tipo: f.tipo, total: 0, suma: 0, dificultad: [0, 0, 0] };
    v.total += 1;
    v.suma += f.gusto;
    if (f.dificultad >= 1 && f.dificultad <= 3) v.dificultad[f.dificultad - 1] += 1;
    porJuego.set(f.juego, v);
  }
  return [...porJuego.values()]
    .map(({ suma, ...v }) => ({ ...v, promedio: Math.round((suma / v.total) * 10) / 10 }))
    .sort((a, b) => b.promedio - a.promedio || b.total - a.total);
}

async function panel(res, pase) {
  const [grupo] = await db(`grupos?id=${eq(pase.g)}&select=codigo,nombre,grado,creado_en`);
  if (!grupo) return mal(res, "El grupo ya no existe.", 401);
  const alumnos = await db(`alumnos?grupo_id=${eq(pase.g)}&select=id,apodo,avatar,creado_en,ultima_vez,progreso(datos)&order=apodo_normal`);
  const respuestas = await db(`respuestas?grupo_id=${eq(pase.g)}&select=alumno_id,personaje,mision,bono,correcta&limit=20000`);
  const { preguntas, porAlumno } = resumirRespuestas(respuestas || []);
  // sin alumno_id a propósito: el resumen es anónimo desde la consulta
  const evaluaciones = await db(`evaluaciones?grupo_id=${eq(pase.g)}&select=fecha,${PREGUNTAS_EVAL.map((p) => p.id).join(",")}&limit=20000`);
  const encuestas = await db(`encuestas?grupo_id=${eq(pase.g)}&select=juego,tipo,gusto,dificultad&limit=20000`);
  return responderJson(res, 200, {
    grupo,
    encuestas: resumirEncuestas(encuestas || []),
    evaluacion: resumirEvaluaciones((evaluaciones || []).map(({ alumno_id, ...f }) => f), { hoy: hoyEn() }),
    // campo por campo: aunque la consulta cambie, el PIN resumido nunca sale del servidor
    alumnos: (alumnos || []).map(({ id, apodo, avatar, creado_en, ultima_vez, progreso }) => ({
      id, apodo, avatar, creado_en, ultima_vez,
      ...resumenAlumno(Array.isArray(progreso) ? progreso[0]?.datos : progreso?.datos),
      respuestas: porAlumno[id] || { total: 0, aciertos: 0 },
    })),
    preguntas,
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return mal(res, "Usa GET o POST", 405);
  if (!configuracionDb() || !secreto()) return mal(res, "Los grupos no están disponibles ahorita.", 503);

  try {
    if (req.method === "GET") {
      const pase = paseDe(req, "maestro");
      if (!pase) return mal(res, "Vuelve a entrar con el código y la clave del grupo.", 401);
      return await panel(res, pase);
    }

    let d;
    try { d = await leerCuerpo(req, 4_000); }
    catch { return mal(res, "No entendí el mensaje"); }
    const ip = quienEs(req);

    if (d?.accion === "crear") {
      const nombre = String(d.nombre ?? "").replace(/\s+/g, " ").trim();
      if (nombre.length < 1 || nombre.length > 60) return mal(res, "Ponle al grupo un nombre de hasta 60 letras (por ejemplo «5° B»).");
      if (!Object.prototype.hasOwnProperty.call(GRADOS, d.grado)) return mal(res, "Elige primaria o secundaria.");
      if (!claveValida(d.clave)) return mal(res, "La clave del maestro lleva de 6 a 64 caracteres.");
      if (await revisarIntentos(ip, null)) return mal(res, "Demasiados intentos. Espera unos minutos.", 429);

      const clave = resumirClave(d.clave);
      for (let intento = 0; intento < 4; intento++) {
        try {
          const [grupo] = await db("grupos?select=id,codigo,nombre,grado", {
            metodo: "POST",
            devolver: true,
            cuerpo: { codigo: nuevoCodigo(), nombre, grado: d.grado, clave_maestro: clave },
          });
          const { id, ...publico } = grupo;
          return responderJson(res, 200, { pase: crearPase({ rol: "maestro", g: id }), grupo: publico });
        } catch (e) {
          if (!(e instanceof ErrorDb && e.codigo === "23505")) throw e;   // el código salió repetido: otro
        }
      }
      throw new Error("no salió un código libre");
    }

    if (d?.accion === "entrar") {
      const codigo = limpiarCodigo(d.codigo);
      if (!codigo || typeof d.clave !== "string") return mal(res, "Escribe el código del grupo y tu clave.");
      if (await revisarIntentos(ip, `maestro|${codigo}`)) return mal(res, "Demasiados intentos. Espera un rato.", 429);
      const [grupo] = await db(`grupos?codigo=${eq(codigo)}&select=id,codigo,nombre,grado,clave_maestro`);
      if (!grupo || !claveCorrecta(d.clave, grupo.clave_maestro)) {
        await anotarFallo(ip);
        return mal(res, "Código o clave incorrectos.", 401);
      }
      const { id, clave_maestro, ...publico } = grupo;
      return responderJson(res, 200, { pase: crearPase({ rol: "maestro", g: id }), grupo: publico });
    }

    if (d?.accion === "pin" || d?.accion === "quitar") {
      const pase = paseDe(req, "maestro");
      if (!pase) return mal(res, "Vuelve a entrar con el código y la clave del grupo.", 401);
      if (!UUID.test(String(d.alumno))) return mal(res, "Alumno desconocido");
      const filtro = `alumnos?id=${eq(d.alumno)}&grupo_id=${eq(pase.g)}&select=id`;   // solo alumnos de SU grupo
      if (d.accion === "pin") {
        if (!pinValido(d.pin)) return mal(res, "El PIN son 4 números.");
        const filas = await db(filtro, { metodo: "PATCH", devolver: true, cuerpo: { pin: resumirClave(d.pin) } });
        if (!filas?.length) return mal(res, "Ese alumno no está en tu grupo.", 404);
      } else {
        const filas = await db(filtro, { metodo: "DELETE", devolver: true });
        if (!filas?.length) return mal(res, "Ese alumno no está en tu grupo.", 404);
      }
      return responderJson(res, 200, { ok: true });
    }

    return mal(res, "Acción desconocida");
  } catch (e) {
    console.error("[grupo]", e.estado || "", e.codigo || "", e.message);
    return mal(res, "No pude conectar con la base de datos ahorita.", 502);
  }
}
