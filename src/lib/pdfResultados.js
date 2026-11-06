/**
 * PDF de resultados de las encuestas (ventana de editores).
 *
 * jsPDF se carga solo cuando alguien pide el PDF, así no pesa en el juego. Las gráficas se
 * dibujan con rectángulos (vectoriales: se ven nítidas al imprimir) con los mismos colores y
 * etiquetas de la pantalla; en vez de emojis, que el PDF no sabe dibujar, van las palabras.
 */
import {
  COLORES_GUSTO, ETIQUETAS_GUSTO, COLORES_DIFICULTAD, ETIQUETAS_DIFICULTAD, rellenarDias, porcentaje,
} from "./resultados.js";

const MM = { margen: 14, ancho: 210, alto: 297 };
const TINTA = "#1f2933", SUAVE = "#52606d", LINEA = "#d9dee3";

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Arma el PDF y lo descarga. */
export async function descargarPdf(resumen, datos) {
  const doc = await crearPdf(resumen, datos);
  doc.save(`encuestas-escuadron-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** resumen: lo que da resumir(); datos: { periodo, grado, tipo } en palabras, para el encabezado. */
export async function crearPdf(resumen, datos) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const util = MM.ancho - MM.margen * 2;
  let y = MM.margen;

  const color = (hex, tipo = "fill") => (tipo === "fill" ? doc.setFillColor(...rgb(hex)) : tipo === "draw" ? doc.setDrawColor(...rgb(hex)) : doc.setTextColor(...rgb(hex)));
  const texto = (t, x, yy, { tam = 10, negrita = false, tinta = TINTA, alinear = "left" } = {}) => {
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(tam);
    color(tinta, "text");
    doc.text(String(t), x, yy, { align: alinear });
  };
  const espacio = (mm) => {
    if (y + mm > MM.alto - MM.margen) {
      doc.addPage();
      y = MM.margen;
    }
  };
  const recortar = (t, max) => {
    doc.setFontSize(9);
    let s = String(t);
    while (doc.getTextWidth(s) > max && s.length > 3) s = s.slice(0, -2);
    return s === String(t) ? s : s.trimEnd() + "…";
  };

  // ---- encabezado ----
  texto("Escuadrón Tecnito y Greencito", MM.margen, y + 5, { tam: 16, negrita: true });
  texto("Resultados de las encuestas de satisfacción de los juegos", MM.margen, y + 11, { tam: 11, tinta: SUAVE });
  texto(`Periodo: ${datos.periodo} · Grado: ${datos.grado} · Tipo: ${datos.tipo}`, MM.margen, y + 17, { tam: 9, tinta: SUAVE });
  texto(`Generado el ${new Date().toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}`, MM.margen, y + 22, { tam: 9, tinta: SUAVE });
  y += 30;

  // ---- cifras ----
  const g = resumen.general;
  const cifras = [
    ["Respuestas", String(g.total)],
    ["¿Les gustó? (1 a 5)", g.total ? g.promedio.toFixed(1) : "—"],
    ["Dificultad «justa»", g.total ? `${porcentaje(g.dificultad[1], g.total)}%` : "—"],
    ["Juegos evaluados", String(resumen.juegos.length)],
  ];
  const anchoCifra = (util - 9) / 4;
  cifras.forEach(([titulo, valor], i) => {
    const x = MM.margen + i * (anchoCifra + 3);
    color(LINEA, "draw");
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, anchoCifra, 18, 2, 2, "S");
    texto(titulo, x + 3, y + 6, { tam: 8, tinta: SUAVE });
    texto(valor, x + 3, y + 14, { tam: 14, negrita: true });
  });
  y += 26;

  // ---- gráfica de barras apiladas al 100 % por juego ----
  function apiladas(titulo, nota, colores, etiquetas, conteos, derecha) {
    espacio(30);
    texto(titulo, MM.margen, y + 4, { tam: 12, negrita: true });
    texto(nota, MM.margen, y + 9, { tam: 8.5, tinta: SUAVE });
    y += 13;
    // leyenda
    let x = MM.margen;
    etiquetas.forEach((e, i) => {
      color(colores[i]);
      doc.rect(x, y - 2.6, 3, 3, "F");
      texto(e.texto, x + 4.2, y, { tam: 8.5 });
      x += 4.2 + doc.getTextWidth(e.texto) + 6;
    });
    y += 5;

    const anchoNombre = 52, anchoCifras = 26;
    const anchoBarra = util - anchoNombre - anchoCifras - 4;
    for (const j of resumen.juegos) {
      espacio(7);
      const valores = conteos(j);
      const total = valores.reduce((s, n) => s + n, 0);
      texto(recortar(j.nombre, anchoNombre - 2), MM.margen, y + 3.6, { tam: 9 });
      let xb = MM.margen + anchoNombre;
      valores.forEach((n, i) => {
        if (!n) return;
        const w = (n / total) * anchoBarra;
        color(colores[i]);
        doc.rect(xb, y, Math.max(0, w - 0.5), 5, "F");   // 0.5 mm de separación entre segmentos
        xb += w;
      });
      texto(derecha(j), MM.ancho - MM.margen, y + 3.6, { tam: 8.5, tinta: SUAVE, alinear: "right" });
      y += 7;
    }
    y += 5;
  }

  if (resumen.juegos.length) {
    apiladas(
      "¿Les gustó? por juego",
      "Cada barra es el 100% de las respuestas del juego. A la derecha: promedio de 1 (nada) a 5 (muy bien) y número de respuestas.",
      COLORES_GUSTO.claro, ETIQUETAS_GUSTO, (j) => j.gusto,
      (j) => `${j.promedio.toFixed(1)} · ${j.total} resp.`,
    );
    apiladas(
      "¿Qué tan difícil fue? por juego",
      "Lo ideal es que la mayoría diga «Justo». Mismo orden que la gráfica anterior. A la derecha: % que dijo «Justo».",
      COLORES_DIFICULTAD, ETIQUETAS_DIFICULTAD, (j) => j.dificultad,
      (j) => `${porcentaje(j.dificultad[1], j.total)}% justo`,
    );
  } else {
    texto("No hay respuestas con estos filtros.", MM.margen, y + 4, { tam: 10, tinta: SUAVE });
    y += 12;
  }

  // ---- respuestas por día ----
  const dias = rellenarDias(resumen.dias);
  if (dias.length) {
    espacio(60);
    texto("Respuestas por día", MM.margen, y + 4, { tam: 12, negrita: true });
    y += 9;
    const alto = 40;
    const max = Math.max(...dias.map((d) => d.total), 1);
    const paso = util / dias.length;
    const ancho = Math.max(0.6, Math.min(8, paso - 0.6));
    color(LINEA, "draw");
    doc.setLineWidth(0.2);
    doc.line(MM.margen, y + alto, MM.margen + util, y + alto);
    texto(String(max), MM.margen, y + 2, { tam: 7.5, tinta: SUAVE });
    dias.forEach((d, i) => {
      const h = (d.total / max) * (alto - 4);
      if (h > 0) {
        color("#4f8ed6");
        doc.rect(MM.margen + i * paso + (paso - ancho) / 2, y + alto - h, ancho, h, "F");
      }
    });
    const formato = (k) => new Date(k + "T12:00:00Z").toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
    texto(formato(dias[0].dia), MM.margen, y + alto + 4.5, { tam: 7.5, tinta: SUAVE });
    texto(formato(dias[dias.length - 1].dia), MM.margen + util, y + alto + 4.5, { tam: 7.5, tinta: SUAVE, alinear: "right" });
    y += alto + 12;
  }

  // ---- tabla ----
  if (resumen.juegos.length) {
    espacio(20);
    texto("Tabla de resultados", MM.margen, y + 4, { tam: 12, negrita: true });
    y += 9;
    const cols = [
      ["Juego", 0, "left"], ["Resp.", 70, "right"], ["Prom.", 82, "right"],
      ["Nada", 96, "right"], ["Poco", 108, "right"], ["Regular", 124, "right"], ["Bien", 136, "right"], ["Muy bien", 152, "right"],
      ["Fácil", 162, "right"], ["Justo", 172, "right"], ["Difícil", 182, "right"],
    ];
    const fila = (valores, negrita) => {
      espacio(6);
      valores.forEach((v, i) => {
        const [, x, alinear] = cols[i];
        texto(i === 0 ? recortar(v, 56) : v, MM.margen + x, y + 4, { tam: 8, negrita, alinear });
      });
      color(LINEA, "draw");
      doc.line(MM.margen, y + 5.6, MM.margen + util, y + 5.6);
      y += 6;
    };
    fila(cols.map((c) => c[0]), true);
    for (const j of resumen.juegos) {
      fila([j.nombre, j.total, j.promedio.toFixed(1), ...j.gusto, ...j.dificultad].map(String), false);
    }
  }

  if (resumen.fueraDeCatalogo) {
    espacio(8);
    texto(`No se incluyen ${resumen.fueraDeCatalogo} respuestas de juegos que no están en el catálogo (pruebas o juegos retirados).`, MM.margen, y + 4, { tam: 8, tinta: SUAVE });
  }

  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    texto(`Página ${p} de ${paginas}`, MM.ancho - MM.margen, MM.alto - 7, { tam: 8, tinta: SUAVE, alinear: "right" });
  }
  return doc;
}
