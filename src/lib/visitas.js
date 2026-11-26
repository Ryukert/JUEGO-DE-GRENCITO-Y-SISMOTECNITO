/**
 * Contador de visitas, del lado del navegador.
 *
 * - registrarVisita: la primera vez del día en este navegador suma una visita (POST); las
 *   demás solo leen el número (GET). Lo llama src/main.jsx al abrir el sitio (no la
 *   administración). Nunca lanza error: sin internet o sin base de datos, no se muestra nada.
 * - useVisitas: el número para la portada ({ total, hoy } o null mientras no lo hay).
 */
import { useSyncExternalStore } from "react";

const LLAVE = "escuadron-visita";   // fecha (AAAA-MM-DD) de la última visita contada aquí

let estado = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());

const fechaLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function leer() { try { return localStorage.getItem(LLAVE); } catch { return null; } }
function guardar(v) { try { localStorage.setItem(LLAVE, v); } catch { /* incógnito */ } }

export async function registrarVisita({ hoy = fechaLocal() } = {}) {
  // los navegadores automáticos (pruebas, robots) no cuentan
  if (typeof navigator !== "undefined" && navigator.webdriver) return null;
  const nueva = leer() !== hoy;
  try {
    const r = await fetch("/api/visita", nueva ? { method: "POST" } : undefined);
    if (!r.ok) return null;
    const d = await r.json();
    if (nueva) guardar(hoy);
    if (Number.isFinite(d?.total)) {
      estado = { total: d.total, hoy: Number.isFinite(d.hoy) ? d.hoy : null };
      avisar();
    }
    return estado;
  } catch {
    return null;
  }
}

/** Para las pruebas: olvida el número. */
export function reiniciarVisitas() {
  estado = null;
  avisar();
}

export function useVisitas() {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    () => estado,
    () => null,
  );
}
