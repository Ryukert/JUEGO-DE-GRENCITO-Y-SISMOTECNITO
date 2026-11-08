/**
 * PDF del panel del maestro: el avance de cada alumno, el avance del grupo por tema, la tarea
 * y las preguntas que más cuestan. Para imprimirlo o mandarlo a la dirección.
 *
 * jsPDF se carga solo al pedir el PDF (igual que en la constancia y en editores). Las barras
 * son rectángulos: se ven nítidas al imprimir. No lleva emojis, que el PDF no sabe dibujar.
 */
import { PERSONAJES, GRADOS } from "../data/personajes.js";

const MM = { margen: 14, ancho: 210, alto: 297 };
const TINTA = [31, 41, 51], SUAVE = [82, 96, 109], LINEA = [217, 222, 227], BARRA = [15, 111, 196], FONDO = [235, 240, 245];

export const porciento = (a, t) => (t ? Math.round((a / t) * 100) : null);
const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—");

/**
 * datos: lo que da GET /api/grupo. nombres: id de minijuego → nombre (del catálogo del Centro).
 * Devuelve el documento de jsPDF (sin descargarlo).
 */
export async function crearPdfGrupo(datos, { nombres = {}, hoy = new Date() } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const util = MM.ancho - MM.margen * 2;
  let y = MM.margen;

  const texto = (t, x, yy, { tam = 10, negrita = false, color = TINTA, alinear = "left", ancho } = {}) => {
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    const lineas = ancho ? doc.splitTextToSize(String(t), ancho) : String(t);
    doc.text(lineas, x, yy, { align: alinear });
    return Array.isArray(lineas) ? lineas.length : 1;
  };
  const espacio = (mm) => {
    if (y + mm > MM.alto - MM.margen) {
      doc.addPage();
      y = MM.margen;
    }
  };
  const titulo = (t) => {
    espacio(14);
    y += 4;
    texto(t, MM.margen, y, { tam: 13, negrita: true });
    y += 2;
    doc.setDrawColor(...LINEA);
    doc.line(MM.margen, y, MM.margen + util, y);
    y += 6;
  };

  const g = datos.grupo || {};
  const alumnos = datos.alumnos || [];
  texto("Escuadrón Tecnito y Greencito · Panel del maestro", MM.margen, y, { tam: 9, color: SUAVE });
  y += 8;
  texto(g.nombre || "Mi grupo", MM.margen, y, { tam: 18, negrita: true });
  y += 7;
  texto(`Código ${g.codigo || ""} · ${GRADOS[g.grado]?.nombre || ""} · ${fechaCorta(hoy)}`, MM.margen, y, { tam: 10, color: SUAVE });
  y += 8;

  // cifras
  const total = alumnos.reduce((s, a) => s + (a.respuestas?.total || 0), 0);
  const aciertos = alumnos.reduce((s, a) => s + (a.respuestas?.aciertos || 0), 0);
  const semana = hoy.getTime() - 7 * 86_400_000;
  const cifras = [
    ["Alumnos", alumnos.length],
    ["Activos esta semana", alumnos.filter((a) => new Date(a.ultima_vez).getTime() > semana).length],
    ["Respuestas", total],
    ["Aciertos", total ? `${porciento(aciertos, total)} %` : "—"],
  ];
  const anchoCifra = util / cifras.length;
  cifras.forEach(([nombre, valor], i) => {
    const x = MM.margen + i * anchoCifra;
    doc.setFillColor(...FONDO);
    doc.roundedRect(x + 1, y, anchoCifra - 2, 16, 2, 2, "F");
    texto(String(valor), x + anchoCifra / 2, y + 8, { tam: 13, negrita: true, alinear: "center" });
    texto(nombre, x + anchoCifra / 2, y + 13, { tam: 8, color: SUAVE, alinear: "center" });
  });
  y += 22;

  // tarea
  const tarea = datos.tarea;
  if (tarea) {
    titulo("Tarea del grupo");
    const lista = tarea.juegos.map((id) => nombres[id] || id).join(", ");
    y += 5 * texto(`Minijuegos: ${lista}`, MM.margen, y, { ancho: util }) - 5;
    y += 5;
    if (tarea.nota) {
      y += 5 * texto(`Nota: ${tarea.nota}`, MM.margen, y, { ancho: util, color: SUAVE }) - 5;
      y += 5;
    }
    const cumplieron = alumnos.filter((a) => a.tarea && a.tarea.hechos >= a.tarea.total).length;
    texto(`Desde el ${fechaCorta(tarea.desde)} · ${cumplieron} de ${alumnos.length} alumnos la terminaron`, MM.margen, y, { color: SUAVE });
    y += 6;
  }

  // alumnos
  titulo("Alumnos");
  const columnas = [
    { t: "Alumno", w: 46 }, { t: "XP", w: 18 }, { t: "Misiones", w: 22 }, { t: "Minijuegos", w: 24 },
    { t: "Aciertos", w: 30 }, { t: "Última vez", w: 26 }, ...(tarea ? [{ t: "Tarea", w: 16 }] : []),
  ];
  const encabezado = () => {
    let x = MM.margen;
    doc.setFillColor(...FONDO);
    doc.rect(MM.margen, y - 4.5, util, 7, "F");
    for (const c of columnas) {
      texto(c.t, x + 1.5, y, { tam: 9, negrita: true });
      x += c.w;
    }
    y += 7;
  };
  if (!alumnos.length) {
    texto("Todavía no entra ningún alumno.", MM.margen, y, { color: SUAVE });
    y += 6;
  } else {
    encabezado();
    for (const a of alumnos) {
      if (y + 7 > MM.alto - MM.margen) {
        doc.addPage();
        y = MM.margen + 4;
        encabezado();
      }
      const pct = porciento(a.respuestas?.aciertos || 0, a.respuestas?.total || 0);
      const celdas = [
        a.apodo, a.xp, a.misiones, a.minijuegos,
        pct === null ? "—" : `${pct} % de ${a.respuestas.total}`,
        fechaCorta(a.ultima_vez),
        ...(tarea ? [a.tarea ? `${a.tarea.hechos}/${a.tarea.total}` : "—"] : []),
      ];
      let x = MM.margen;
      celdas.forEach((v, i) => {
        texto(String(v ?? "—"), x + 1.5, y, { tam: 9 });
        x += columnas[i].w;
      });
      doc.setDrawColor(...LINEA);
      doc.line(MM.margen, y + 2.5, MM.margen + util, y + 2.5);
      y += 7;
    }
  }

  // avance por tema
  titulo("Avance por tema (aciertos del grupo en las misiones)");
  const temas = datos.temas || [];
  if (!temas.length) {
    texto("Aparece cuando el grupo juega las misiones.", MM.margen, y, { color: SUAVE });
    y += 6;
  }
  for (const t of temas) {
    espacio(9);
    const pct = porciento(t.aciertos, t.total) ?? 0;
    texto(`${PERSONAJES[t.personaje]?.nombre || ""} · ${t.tema}`, MM.margen, y, { tam: 9 });
    const xBarra = MM.margen + 82, wBarra = util - 82 - 30;
    doc.setFillColor(...FONDO);
    doc.rect(xBarra, y - 3.5, wBarra, 4.5, "F");
    doc.setFillColor(...BARRA);
    doc.rect(xBarra, y - 3.5, (wBarra * pct) / 100, 4.5, "F");
    texto(`${pct} % de ${t.total}`, MM.margen + util, y, { tam: 9, alinear: "right", color: SUAVE });
    y += 7;
  }

  // preguntas difíciles
  const dificiles = (datos.preguntas || []).filter((q) => q.total >= 3 && q.fallos > 0).slice(0, 8);
  if (dificiles.length) {
    titulo("Preguntas que más cuestan");
    for (const q of dificiles) {
      espacio(16);
      texto(`${porciento(q.fallos, q.total)} % falla · ${PERSONAJES[q.personaje]?.nombre || ""} · ${q.titulo}${q.bono ? " (bonificación)" : ""}`, MM.margen, y, { tam: 9, negrita: true });
      y += 5;
      y += 4.5 * texto(q.pregunta, MM.margen, y, { tam: 9, color: SUAVE, ancho: util });
      y += 2;
    }
  }

  // pie con número de página
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    texto(`${g.nombre || ""} · página ${i} de ${paginas}`, MM.ancho / 2, MM.alto - 7, { tam: 8, color: SUAVE, alinear: "center" });
  }
  return doc;
}

export async function descargarPdfGrupo(datos, opciones) {
  const doc = await crearPdfGrupo(datos, opciones);
  doc.save(`grupo-${datos.grupo?.codigo || "escuadron"}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
