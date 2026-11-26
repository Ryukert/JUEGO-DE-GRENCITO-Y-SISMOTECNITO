// Herramienta de revisar.html: la misma página en varios tamaños de pantalla reales.
// Va en su propio archivo (no dentro del HTML) para que la Content-Security-Policy no la bloquee.

// Tamaños reales de pantalla, no aproximaciones.
const DISPOSITIVOS = [
  { nombre: "iPhone SE", w: 320, h: 568, nota: "el más apretado" },
  { nombre: "Android de entrada", w: 360, h: 640, nota: "el más común en escuelas" },
  { nombre: "iPhone 14", w: 390, h: 844, nota: "" },
  { nombre: "Pixel 7 Pro", w: 412, h: 892, nota: "" },
  { nombre: "iPhone acostado", w: 844, h: 390, nota: "poco alto" },
  { nombre: "iPad vertical", w: 768, h: 1024, nota: "" },
  { nombre: "iPad horizontal", w: 1024, h: 768, nota: "" },
  { nombre: "Laptop", w: 1280, h: 800, nota: "" },
];

const rejilla = document.getElementById("rejilla");
const campo = document.getElementById("ruta");

// En pantallas chicas los marcos grandes se muestran a escala para
// que quepan, pero por dentro siguen midiendo lo que dicen medir.
function escala(ancho) {
  const disponible = Math.min(window.innerWidth - 60, 1300);
  return ancho > disponible ? disponible / ancho : 1;
}

function pintar(ruta) {
  rejilla.innerHTML = "";
  DISPOSITIVOS.forEach((d) => {
    const z = escala(d.w);
    const fig = document.createElement("figure");
    fig.style.width = d.w * z + "px";

    const cap = document.createElement("figcaption");
    cap.innerHTML =
      "<span>" + d.nombre + "</span><small>" +
      d.w + "×" + d.h + (d.nota ? " · " + d.nota : "") +
      (z < 1 ? " · a escala" : "") + "</small>";

    const marco = document.createElement("iframe");
    marco.src = ruta;
    marco.width = d.w;
    marco.height = d.h;
    marco.title = d.nombre;
    marco.style.width = d.w + "px";
    marco.style.height = d.h + "px";
    marco.style.transform = "scale(" + z + ")";
    marco.style.transformOrigin = "top left";

    const caja = document.createElement("div");
    caja.style.height = d.h * z + "px";
    caja.style.width = d.w * z + "px";
    caja.style.overflow = "hidden";
    caja.appendChild(marco);

    fig.appendChild(cap);
    fig.appendChild(caja);
    rejilla.appendChild(fig);
  });
}

document.getElementById("ir").onclick = () => pintar(campo.value || "/");
document.getElementById("recargar").onclick = () => pintar(campo.value || "/");
campo.onkeydown = (e) => { if (e.key === "Enter") pintar(campo.value || "/"); };
window.addEventListener("resize", () => pintar(campo.value || "/"));

pintar("/");
