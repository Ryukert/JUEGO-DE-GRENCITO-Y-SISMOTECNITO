/**
 * Preferencias de quien juega (se guardan en este navegador):
 *
 *   letraGrande      textos más grandes (primeros grados, lectura difícil)
 *   menosMovimiento  apaga animaciones y confeti aunque el sistema no lo pida
 *   vibracion        pulso corto al acertar y al fallar (solo teléfonos)
 *   tutorialVisto    ya vio la explicación de 3 pasos
 *   ultimo           último personaje y grado, para «Seguir jugando»
 *
 * El sonido y el tema tienen su propio archivo (sonido.js, tema.js).
 */

const LLAVE = "escuadron-preferencias";
const BASE = { letraGrande: false, menosMovimiento: false, vibracion: true, tutorialVisto: false, ultimo: null };

let memoria = null;

export function leerPreferencias() {
  if (!memoria) {
    memoria = { ...BASE };
    try {
      const crudo = JSON.parse(localStorage.getItem(LLAVE) || "{}");
      for (const k of Object.keys(BASE)) if (k in crudo) memoria[k] = crudo[k];
    } catch (e) {
      /* sin almacenamiento: valores de fábrica */
    }
  }
  return { ...memoria };
}

export function guardarPreferencia(clave, valor) {
  leerPreferencias();
  memoria[clave] = valor;
  try {
    localStorage.setItem(LLAVE, JSON.stringify(memoria));
  } catch (e) {
    /* queda en memoria */
  }
  aplicarPreferencias();
  return { ...memoria };
}

/** Para pruebas y para «Borrar progreso». */
export function reiniciarPreferencias() {
  memoria = null;
  try {
    localStorage.removeItem(LLAVE);
  } catch (e) {}
  aplicarPreferencias();
}

/** Refleja letra grande y menos movimiento en <html> para que el CSS los aplique. */
export function aplicarPreferencias() {
  const p = leerPreferencias();
  const raiz = document.documentElement;
  if (p.letraGrande) raiz.dataset.letra = "grande";
  else delete raiz.dataset.letra;
  if (p.menosMovimiento) raiz.dataset.movimiento = "reducido";
  else delete raiz.dataset.movimiento;
}

/** Menos movimiento: lo pide el sistema o se eligió en Ajustes. */
export function menosMovimiento() {
  if (leerPreferencias().menosMovimiento) return true;
  try {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    return false;
  }
}

/** Vibra si el teléfono puede y la vibración está encendida. */
export function vibrar(patron) {
  if (!leerPreferencias().vibracion) return;
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(patron);
  } catch (e) {
    /* algunos navegadores lo bloquean sin gesto */
  }
}
