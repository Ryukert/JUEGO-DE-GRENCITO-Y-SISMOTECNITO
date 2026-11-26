/**
 * PDF de la evaluación abierta (/opinion), desde la administración:
 *
 *   - crearCartel: cartel tamaño carta para imprimir y pegar (salón, stand, entrada de un evento):
 *     «¿Qué te pareció? Escanea y califícanos» con un código QR grande que abre /opinion.
 *   - crearReporte: resultados para presentar (promedio y caritas por pregunta, quién contestó,
 *     opiniones por día).
 *   - csvOpiniones: la misma información para Excel.
 *
 * jsPDF y el QR se cargan solo al pedirlos. El QR y las caritas se dibujan con figuras
 * (vectoriales: nítidos al imprimir); el PDF no sabe dibujar emojis.
 */
import { ESCALA_OPINION } from "../data/opinion.js";
import { PERSONAJES } from "../data/personajes.js";

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const TINTA = "#10304f", SUAVE = "#52606d", LINEA = "#d9dee3", AZUL = "#0f6fc4", VERDE = "#3f8a1f";

/** Imagen (webp) → PNG para el PDF; si no se puede (pruebas, navegador viejo), null. */
async function imagenPng(url, altoMax = 420) {
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, altoMax / img.naturalHeight);
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * escala);
    c.height = Math.round(img.naturalHeight * escala);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return { data: c.toDataURL("image/png"), proporcion: img.naturalWidth / img.naturalHeight };
  } catch {
    return null;
  }
}

function ayudante(doc) {
  const color = (hex, tipo = "fill") =>
    tipo === "fill" ? doc.setFillColor(...rgb(hex)) : tipo === "draw" ? doc.setDrawColor(...rgb(hex)) : doc.setTextColor(...rgb(hex));
  const texto = (t, x, y, { tam = 10, negrita = false, tinta = TINTA, alinear = "left" } = {}) => {
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(tam);
    color(tinta, "text");
    doc.text(String(t), x, y, { align: alinear });
  };
  /** Carita de 1 (enojada) a 5 (feliz): círculo de color, ojos y boca curva. */
  const carita = (cx, cy, r, valor) => {
    const c = ESCALA_OPINION[valor - 1];
    color(c.color);
    color(TINTA, "draw");
    doc.setLineWidth(r * 0.08);
    doc.circle(cx, cy, r, "FD");
    color(TINTA);
    doc.circle(cx - r * 0.33, cy - r * 0.22, r * 0.11, "F");
    doc.circle(cx + r * 0.33, cy - r * 0.22, r * 0.11, "F");
    const curva = [-0.32, -0.16, 0, 0.18, 0.36][valor - 1] * r;   // negativa: boca triste
    const w = r * 0.9, y0 = cy + r * 0.38 - curva / 2;
    doc.setLineWidth(r * 0.1);
    doc.lines([[w / 3, curva, (2 * w) / 3, curva, w, 0]], cx - w / 2, y0, [1, 1], "S", false);
  };
  return { color, texto, carita };
}

/** Cartel para imprimir con el QR de /opinion. */
export async function crearCartel(direccion, { imagenes = true } = {}) {
  const [{ jsPDF }, { matrizQr }] = await Promise.all([import("jspdf"), import("./qr.js")]);
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 215.9, H = 279.4, cx = W / 2;
  const { color, texto, carita } = ayudante(doc);

  // marco doble: azul (Tecnito) y verde (Greencito), como la constancia
  doc.setLineWidth(3);
  color(AZUL, "draw");
  doc.roundedRect(8, 8, W - 16, H - 16, 6, 6, "S");
  doc.setLineWidth(1.2);
  color(VERDE, "draw");
  doc.roundedRect(13, 13, W - 26, H - 26, 4, 4, "S");

  texto("Escuadrón Tecnito y Greencito", cx, 30, { tam: 15, negrita: true, tinta: AZUL, alinear: "center" });
  texto("¿Qué te pareció?", cx, 50, { tam: 40, negrita: true, alinear: "center" });
  texto("Escanea el código con la cámara de tu celular y califícanos", cx, 61, { tam: 14, alinear: "center" });

  // las cinco caritas, de muy mal a excelente
  const r = 7.5, sep = 26, x0 = cx - sep * 2;
  ESCALA_OPINION.forEach((e, i) => {
    carita(x0 + i * sep, 78, r, e.valor);
    texto(e.etiqueta, x0 + i * sep, 78 + r + 5, { tam: 9, tinta: SUAVE, alinear: "center" });
  });

  // el QR, grande y con su margen blanco (4 módulos, lo que piden los lectores)
  const matriz = matrizQr(direccion);
  const lado = 100, n = matriz.length, m = lado / (n + 8);
  const qx = cx - lado / 2, qy = 100;
  color("#ffffff");
  color(TINTA, "draw");
  doc.setLineWidth(0.6);
  doc.roundedRect(qx, qy, lado, lado, 3, 3, "FD");
  color("#000000");
  matriz.forEach((fila, f) => fila.forEach((negro, c) => {
    if (negro) doc.rect(qx + (c + 4) * m, qy + (f + 4) * m, m + 0.02, m + 0.02, "F");   // +0.02: sin rayitas entre cuadros
  }));

  texto("O entra a:", cx, qy + lado + 10, { tam: 11, tinta: SUAVE, alinear: "center" });
  texto(direccion.replace(/^https?:\/\//, ""), cx, qy + lado + 18, { tam: 16, negrita: true, tinta: AZUL, alinear: "center" });
  texto("Solo tocas caritas: no necesitas registrarte y nadie sabe quién contestó.", cx, qy + lado + 26, { tam: 11, alinear: "center" });

  // los personajes en las esquinas de abajo, debajo del último texto (no se enciman)
  if (imagenes && typeof document !== "undefined") {
    const [sismo, green] = await Promise.all([imagenPng(PERSONAJES.sismo.cuerpo), imagenPng(PERSONAJES.green.cuerpo)]);
    const alto = 30, y = H - 18 - alto;
    if (sismo) doc.addImage(sismo.data, "PNG", 20, y, alto * sismo.proporcion, alto, undefined, "FAST");
    if (green) doc.addImage(green.data, "PNG", W - 20 - alto * green.proporcion, y, alto * green.proporcion, alto, undefined, "FAST");
  }
  texto("¡Gracias por ayudarnos a mejorar!", cx, H - 24, { tam: 13, negrita: true, tinta: VERDE, alinear: "center" });
  return doc;
}

/**
 * Reporte de resultados. r: lo que da resumirOpiniones(); datos: { periodo, quien } en palabras.
 */
export async function crearReporte(r, datos) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 215.9, H = 279.4, M = 16, util = W - M * 2;
  const { color, texto, carita } = ayudante(doc);
  let y = M;
  const espacio = (mm) => { if (y + mm > H - M) { doc.addPage(); y = M; } };

  texto("Escuadrón Tecnito y Greencito", M, y + 5, { tam: 16, negrita: true });
  texto("Evaluación abierta: lo que opina quien usa el juego", M, y + 11, { tam: 11, tinta: SUAVE });
  texto(`Periodo: ${datos.periodo} · Quién contestó: ${datos.quien}`, M, y + 17, { tam: 9, tinta: SUAVE });
  texto(`Generado el ${new Date().toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}`, M, y + 22, { tam: 9, tinta: SUAVE });
  y += 32;

  texto(`${r.total} ${r.total === 1 ? "opinión" : "opiniones"}`, M, y, { tam: 13, negrita: true });
  y += 8;

  if (!r.total) {
    texto("No hay opiniones con estos filtros.", M, y + 4, { tam: 10, tinta: SUAVE });
    return doc;
  }

  // leyenda
  let lx = M;
  ESCALA_OPINION.forEach((e) => {
    color(e.color);
    doc.rect(lx, y - 2.6, 3, 3, "F");
    texto(e.etiqueta, lx + 4.2, y, { tam: 8.5 });
    lx += 4.2 + doc.getTextWidth(e.etiqueta) + 6;
  });
  y += 7;

  // una fila por pregunta: carita del promedio, texto, barra al 100 % y conteos
  for (const p of r.preguntas) {
    espacio(26);
    const valor = Math.min(5, Math.max(1, Math.round(p.promedio)));
    carita(M + 7, y + 7, 6.5, valor);
    texto(p.texto, M + 18, y + 5, { tam: 11, negrita: true });
    texto(`${p.promedio.toFixed(1)} de 5 · ${ESCALA_OPINION[valor - 1].etiqueta}`, M + 18, y + 10.5, { tam: 9, tinta: SUAVE });
    const bx = M + 18, bw = util - 18, by = y + 14;
    let x = bx;
    p.conteo.forEach((n, i) => {
      if (!n) return;
      const w = (n / r.total) * bw;
      color(ESCALA_OPINION[i].color);
      doc.rect(x, by, Math.max(0, w - 0.5), 5, "F");
      x += w;
    });
    texto(ESCALA_OPINION.map((e, i) => `${e.etiqueta}: ${p.conteo[i]}`).join("   "), bx, by + 9.5, { tam: 8, tinta: SUAVE });
    y += 28;
  }

  // quién contestó
  espacio(30);
  texto("Quién contestó («Yo soy…», opcional)", M, y + 4, { tam: 12, negrita: true });
  y += 10;
  for (const q of r.quienes.filter((q) => q.total)) {
    espacio(6);
    texto(q.texto, M, y + 3.5, { tam: 9.5 });
    texto(String(q.total), M + 80, y + 3.5, { tam: 9.5, negrita: true, alinear: "right" });
    color(LINEA, "draw");
    doc.setLineWidth(0.2);
    doc.line(M, y + 5.2, M + 80, y + 5.2);
    y += 6;
  }
  y += 6;

  // opiniones por día
  if (r.dias.length) {
    espacio(56);
    texto("Opiniones por día", M, y + 4, { tam: 12, negrita: true });
    y += 9;
    const alto = 36, max = Math.max(...r.dias.map((d) => d.total), 1);
    const paso = util / r.dias.length, ancho = Math.max(0.8, Math.min(10, paso - 0.8));
    color(LINEA, "draw");
    doc.line(M, y + alto, M + util, y + alto);
    texto(String(max), M, y + 2, { tam: 7.5, tinta: SUAVE });
    r.dias.forEach((d, i) => {
      const h = (d.total / max) * (alto - 4);
      color("#4f8ed6");
      doc.rect(M + i * paso + (paso - ancho) / 2, y + alto - h, ancho, h, "F");
    });
    const f = (k) => new Date(k + "T12:00:00Z").toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
    texto(f(r.dias[0].dia), M, y + alto + 4.5, { tam: 7.5, tinta: SUAVE });
    texto(f(r.dias[r.dias.length - 1].dia), M + util, y + alto + 4.5, { tam: 7.5, tinta: SUAVE, alinear: "right" });
  }

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    texto(`Página ${i} de ${paginas}`, W - M, H - 8, { tam: 8, tinta: SUAVE, alinear: "right" });
  }
  return doc;
}

/** CSV para Excel (con BOM para que abra bien los acentos). */
export function csvOpiniones(r, datos) {
  const celda = (v) => (/[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const filas = [
    ["Evaluación abierta", `Periodo: ${datos.periodo}`, `Quién: ${datos.quien}`],
    [],
    ["Pregunta", "Promedio (1 a 5)", ...ESCALA_OPINION.map((e) => e.etiqueta), "Total"],
    ...r.preguntas.map((p) => [p.texto, p.promedio.toFixed(2), ...p.conteo, r.total]),
    [],
    ["Quién contestó", "Opiniones"],
    ...r.quienes.map((q) => [q.texto, q.total]),
    [],
    ["Día", "Opiniones"],
    ...r.dias.map((d) => [d.dia, d.total]),
  ];
  return "﻿" + filas.map((f) => f.map(celda).join(",")).join("\r\n");
}
