/**
 * Código QR de un texto (la dirección de /opinion), con qrcode-generator. Se importa solo al
 * pedir el cartel o la vista previa en la administración, así no pesa en el juego.
 *
 * Nivel de corrección «M» (15 %): aguanta que el cartel impreso se raye o se doble un poco.
 */
import { qrcode } from "qrcode-generator";

/** → matriz de booleanos (true = cuadro negro), sin el margen blanco. */
export function matrizQr(texto) {
  const qr = qrcode(0, "M");   // 0: el tamaño más chico en el que quepa el texto
  qr.addData(String(texto), "Byte");
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, f) => Array.from({ length: n }, (_, c) => qr.isDark(f, c)));
}

/** Trazo SVG de la matriz (un cuadro de 1×1 por módulo) para dibujarlo nítido a cualquier tamaño. */
export function trazoQr(matriz) {
  let d = "";
  matriz.forEach((fila, f) => fila.forEach((negro, c) => { if (negro) d += `M${c} ${f}h1v1h-1z`; }));
  return d;
}

/** La dirección pública de la evaluación abierta en este sitio. */
export const direccionOpinion = (origen = typeof location !== "undefined" ? location.origin : "") => `${origen}/opinion`;
