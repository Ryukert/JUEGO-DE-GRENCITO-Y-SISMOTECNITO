/**
 * Constancia en PDF para el niño: su nombre, su ID, el rango que alcanzó, sus misiones y su XP.
 * Hoja horizontal lista para imprimir. jsPDF se carga solo al pedirla.
 */
import { PERSONAJES } from "../data/personajes.js";
import { rangoPara } from "./progreso.js";

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Los datos que van en la constancia, a partir del progreso. */
export function datosConstancia(progreso, jugador) {
  const mejor = Math.max(0, ...Object.values(progreso?.records || {}));
  const totalMisiones = Object.values(PERSONAJES).reduce((s, p) => s + p.misiones.length, 0);
  return {
    nombre: jugador?.nombre || "",
    id: jugador?.id || "",
    rango: rangoPara(mejor).nombre,
    mejor,
    misiones: Math.min(totalMisiones, (progreso?.insignias || []).length),
    totalMisiones,
    xp: progreso?.xp || 0,
    juegos: Object.values(progreso?.juegos || {}).filter((j) => j.partidas > 0).length,
    fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
  };
}

/** Convierte una imagen (webp) a PNG para el PDF, a lo que pide una hoja impresa; si no se puede, null. */
async function imagenPng(url, altoMax = 520) {
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

export async function crearConstancia(d, { imagenes = true } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const W = 297, H = 210, cx = W / 2;
  const tinta = "#10304f", azul = "#0f6fc4", verde = "#3f8a1f", naranja = "#c4500e";
  const t = (texto, y, { tam = 14, negrita = false, color = tinta, x = cx, alinear = "center" } = {}) => {
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(tam);
    doc.setTextColor(...rgb(color));
    doc.text(String(texto), x, y, { align: alinear });
  };

  // marco doble: azul (Tecnito) y verde (Greencito)
  doc.setLineWidth(3);
  doc.setDrawColor(...rgb(azul));
  doc.roundedRect(8, 8, W - 16, H - 16, 6, 6, "S");
  doc.setLineWidth(1.2);
  doc.setDrawColor(...rgb(verde));
  doc.roundedRect(14, 14, W - 28, H - 28, 4, 4, "S");

  if (imagenes && typeof document !== "undefined") {
    const [sismo, green] = await Promise.all([imagenPng(PERSONAJES.sismo.cuerpo), imagenPng(PERSONAJES.green.cuerpo)]);
    const alto = 62;
    if (sismo) doc.addImage(sismo.data, "PNG", 24, H - 24 - alto, alto * sismo.proporcion, alto, undefined, "FAST");
    if (green) doc.addImage(green.data, "PNG", W - 24 - alto * green.proporcion, H - 24 - alto, alto * green.proporcion, alto, undefined, "FAST");
  }

  t("Escuadrón Tecnito y Greencito", 34, { tam: 15, negrita: true, color: azul });
  t("CONSTANCIA", 52, { tam: 34, negrita: true });
  t("se otorga con orgullo a", 64, { tam: 13 });

  // nombre (o línea para escribirlo a mano)
  if (d.nombre) {
    t(d.nombre, 82, { tam: 30, negrita: true, color: naranja });
  } else {
    doc.setLineWidth(0.5);
    doc.setDrawColor(...rgb(tinta));
    doc.line(cx - 70, 82, cx + 70, 82);
  }
  doc.setLineWidth(0.6);
  doc.setDrawColor(...rgb(naranja));
  doc.line(cx - 80, 86, cx + 80, 86);
  if (d.id) t(`ID de jugador: ${d.id}`, 94, { tam: 11, color: "#52606d" });

  t("por aprender a cuidarse ante los sismos y a cuidar el medio ambiente,", 106, { tam: 13 });
  t(`alcanzando el rango de ${d.rango}.`, 114, { tam: 13, negrita: true });

  // cifras
  const cifras = [
    [`${d.misiones} de ${d.totalMisiones}`, "misiones"],
    [String(d.xp), "XP"],
    [String(d.juegos), "minijuegos"],
    [String(d.mejor), "mejor puntaje"],
  ];
  const ancho = 34, sep = 6, x0 = cx - (cifras.length * ancho + (cifras.length - 1) * sep) / 2;
  cifras.forEach(([valor, etiqueta], i) => {
    const x = x0 + i * (ancho + sep);
    doc.setLineWidth(0.4);
    doc.setDrawColor(...rgb("#8fb6dd"));
    doc.roundedRect(x, 124, ancho, 20, 3, 3, "S");
    t(valor, 134, { tam: 14, negrita: true, x: x + ancho / 2 });
    t(etiqueta, 140, { tam: 8.5, color: "#52606d", x: x + ancho / 2 });
  });

  t(d.fecha, 160, { tam: 11, color: "#52606d" });
  doc.setLineWidth(0.4);
  doc.setDrawColor(...rgb(tinta));
  doc.line(cx - 40, 178, cx + 40, 178);
  t("Firma del maestro o maestra", 183, { tam: 9, color: "#52606d" });
  return doc;
}

export async function descargarConstancia(progreso, jugador) {
  const d = datosConstancia(progreso, jugador);
  const doc = await crearConstancia(d);
  const archivo = (d.nombre || "jugador").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").toLowerCase();
  doc.save(`constancia-${archivo}.pdf`);
}
