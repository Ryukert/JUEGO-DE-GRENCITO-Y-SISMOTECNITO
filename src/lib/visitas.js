/**
 * Contador de visitas, del lado del navegador.
 *
 * - registrarVisita: la primera vez del día en este navegador suma una visita (POST); las
 *   demás solo leen el número (GET). Lo llama src/main.jsx al abrir el sitio (no la
 *   administración). Nunca lanza error: sin internet o sin base de datos, no se muestra nada.
 * - useVisitas: el número para la portada ({ total, hoy } o null mientras no lo hay). Al abrir,
 *   da el último número que vio este navegador, para que la portada no salte al llegar el nuevo.
 */
import { useSyncExternalStore } from "react";

const LLAVE = "escuadron-visita";   // fecha (AAAA-MM-DD) de la última visita contada aquí
const LLAVE_NUMERO = "escuadron-visitas-numero";   // el último número visto: sale al instante, sin saltos

function numeroGuardado() {
  try {
    const v = JSON.parse(localStorage.getItem(LLAVE_NUMERO) || "null");
    return Number.isFinite(v?.total) ? { total: v.total, hoy: null } : null;   // «hoy» pudo cambiar: espera al nuevo
  } catch { return null; }
}

let estado = numeroGuardado();
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
      try { localStorage.setItem(LLAVE_NUMERO, JSON.stringify({ total: d.total })); } catch { /* incógnito */ }
      avisar();
    }
    return estado;
  } catch {
    return null;
  }
}

/** Para las pruebas: vuelve a leer el número guardado (o null). */
export function reiniciarVisitas() {
  estado = numeroGuardado();
  avisar();
}

export function useVisitas() {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    () => estado,
    () => null,
  );
}
