/**
 * Tarea del maestro (no es una función: el «_» hace que Vercel no la publique).
 *
 * Una tarea por grupo: hasta MAX_JUEGOS minijuegos del Centro y una nota corta. Vive en la
 * tabla `tareas` (supabase/migrations/20261108000000_tareas.sql). Si la tabla todavía no
 * existe en la base de datos, leer devuelve null y guardar avisa: lo demás del panel sigue.
 *
 * El servidor solo revisa que cada juego tenga forma de id; el navegador ignora los que no
 * estén en su catálogo (el catálogo carga componentes de React y aquí no se puede importar).
 */
import { db, eq, ErrorDb } from "./_db.js";

export const MAX_JUEGOS = 5;
export const MAX_NOTA = 140;
const ID = /^[a-z0-9-]{1,40}$/;

/** { juegos, nota } que manda el maestro → la tarea limpia, o null si no sirve. */
export function limpiarTarea(d) {
  const juegos = Array.isArray(d?.juegos) ? [...new Set(d.juegos.filter((j) => typeof j === "string" && ID.test(j)))] : [];
  if (juegos.length < 1 || juegos.length > MAX_JUEGOS) return null;
  const nota = String(d?.nota ?? "").replace(/\s+/g, " ").trim();
  if (nota.length > MAX_NOTA) return null;
  return { juegos, nota };
}

/** ¿El error es porque la tabla de tareas todavía no existe? */
export const faltaTabla = (e) =>
  e instanceof ErrorDb && (e.codigo === "PGRST205" || e.codigo === "42P01" || e.estado === 404);

const formato = (t) => (t ? { juegos: t.juegos, nota: t.nota || "", desde: new Date(t.desde).toISOString() } : null);

/** La tarea del grupo, o null (sin tarea, o sin la tabla todavía). */
export async function leerTarea(grupoId) {
  try {
    const [t] = (await db(`tareas?grupo_id=${eq(grupoId)}&select=juegos,nota,desde`)) || [];
    return formato(t);
  } catch (e) {
    if (faltaTabla(e)) return null;
    throw e;
  }
}

/** Pone (o reemplaza) la tarea; `desde` vuelve a empezar ahora. */
export async function guardarTarea(grupoId, { juegos, nota }) {
  const [t] = await db("tareas?on_conflict=grupo_id", {
    metodo: "POST",
    unir: true,
    devolver: true,
    cuerpo: { grupo_id: grupoId, juegos, nota, desde: new Date().toISOString() },
  });
  return formato(t);
}

export async function quitarTarea(grupoId) {
  await db(`tareas?grupo_id=${eq(grupoId)}`, { metodo: "DELETE" });
}

/** Cuántos juegos de la tarea jugó el alumno después de que se puso. progreso: ya limpio. */
export function cumplimiento(tarea, progreso) {
  if (!tarea) return null;
  const hechos = tarea.juegos.filter((id) => (progreso?.juegos?.[id]?.jugadoEn || "") >= tarea.desde).length;
  return { hechos, total: tarea.juegos.length };
}
