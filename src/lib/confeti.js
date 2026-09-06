/**
 * Confeti ligero sobre un canvas de pantalla completa.
 * Se crea al vuelo y se destruye cuando termina la animación.
 */

let lienzo = null;
let piezas = [];
let corriendo = false;

function preparar() {
  if (lienzo) return lienzo;
  lienzo = document.createElement("canvas");
  lienzo.className = "confeti";
  document.body.appendChild(lienzo);
  return lienzo;
}

function ajustar() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  lienzo.width = window.innerWidth * dpr;
  lienzo.height = window.innerHeight * dpr;
  lienzo.style.width = window.innerWidth + "px";
  lienzo.style.height = window.innerHeight + "px";
  return dpr;
}

export function confeti({ colores = ["#f4691f", "#0f6fc4", "#5aa32a", "#ffd23f"], cantidad = 60, desde = 0.5 } = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  preparar();
  const dpr = ajustar();
  const ctx = lienzo.getContext("2d");
  const x0 = window.innerWidth * desde * dpr;
  const y0 = window.innerHeight * 0.42 * dpr;

  for (let i = 0; i < cantidad; i++) {
    const ang = (Math.PI * 2 * i) / cantidad + Math.random() * 0.4;
    const fuerza = (4 + Math.random() * 7) * dpr;
    piezas.push({
      x: x0,
      y: y0,
      vx: Math.cos(ang) * fuerza,
      vy: Math.sin(ang) * fuerza - 3 * dpr,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.3,
      lado: (5 + Math.random() * 6) * dpr,
      color: colores[i % colores.length],
      vida: 1,
    });
  }

  if (corriendo) return;
  corriendo = true;

  (function paso() {
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    piezas = piezas.filter((p) => p.vida > 0);

    for (const p of piezas) {
      p.vx *= 0.99;
      p.vy += 0.28 * dpr;
      p.x += p.vx;
      p.y += p.vy;
      p.giro += p.vgiro;
      p.vida -= 0.011;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.vida);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.lado / 2, -p.lado / 2, p.lado, p.lado * 0.6);
      ctx.restore();
    }

    if (piezas.length) {
      requestAnimationFrame(paso);
    } else {
      corriendo = false;
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    }
  })();
}
