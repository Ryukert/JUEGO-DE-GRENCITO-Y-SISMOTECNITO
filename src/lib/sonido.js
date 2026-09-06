/**
 * Sonidos generados con Web Audio. Sin archivos, sin descargas.
 * El navegador exige un gesto del usuario antes de sonar, por eso
 * el contexto se crea hasta el primer clic.
 */

let ctx = null;
let activo = true;

try {
  activo = localStorage.getItem("sonido") !== "off";
} catch (e) {
  activo = true;
}

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function sonidoActivo() {
  return activo;
}

export function alternarSonido() {
  activo = !activo;
  try {
    localStorage.setItem("sonido", activo ? "on" : "off");
  } catch (e) {}
  if (activo) tono(880, 0.08, "triangle", 0.16);
  return activo;
}

function tono(freq, dur = 0.12, tipo = "square", vol = 0.14, retraso = 0) {
  if (!activo) return;
  const c = contexto();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipo;
  o.frequency.value = freq;
  const t = c.currentTime + retraso;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function ruido(dur = 0.5, vol = 0.12) {
  if (!activo) return;
  const c = contexto();
  if (!c) return;
  const marcos = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, marcos, c.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < marcos; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / marcos);
  const fuente = c.createBufferSource();
  const filtro = c.createBiquadFilter();
  const g = c.createGain();
  filtro.type = "lowpass";
  filtro.frequency.value = 220;
  g.gain.value = vol;
  fuente.buffer = buffer;
  fuente.connect(filtro).connect(g).connect(c.destination);
  fuente.start();
}

export const sonido = {
  despertar: () => contexto(),
  clic: () => tono(520, 0.06, "square", 0.1),
  bien: () => {
    tono(660, 0.1, "triangle", 0.16);
    tono(880, 0.1, "triangle", 0.16, 0.09);
    tono(1320, 0.16, "triangle", 0.14, 0.18);
  },
  mal: () => {
    tono(200, 0.18, "sawtooth", 0.12);
    tono(150, 0.24, "sawtooth", 0.1, 0.12);
  },
  combo: (n) => {
    const base = 700 + Math.min(n, 6) * 90;
    tono(base, 0.08, "square", 0.13);
    tono(base * 1.5, 0.1, "square", 0.11, 0.07);
  },
  tic: () => tono(1400, 0.03, "square", 0.05),
  alarma: () => {
    tono(880, 0.12, "square", 0.12);
    tono(660, 0.12, "square", 0.12, 0.14);
    tono(880, 0.12, "square", 0.12, 0.28);
  },
  temblor: () => ruido(1.2, 0.14),
  vida: () => tono(300, 0.3, "sine", 0.14),
  victoria: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      tono(f, 0.2, "triangle", 0.16, i * 0.13)
    );
  },
  moneda: () => {
    tono(1050, 0.05, "square", 0.1);
    tono(1400, 0.12, "square", 0.1, 0.05);
  },
};
