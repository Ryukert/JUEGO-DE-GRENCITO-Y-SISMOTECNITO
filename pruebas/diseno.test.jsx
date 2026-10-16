/* Diseño: iconos propios, fuente dentro del proyecto, contraste AA, Centro compacto,
   festejo final y tema oscuro. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import App from "../src/App.jsx";
import Juego from "../src/components/Juego.jsx";
import Final, { estrellasPara } from "../src/components/Final.jsx";
import Centro from "../src/pages/Centro.jsx";
import { PERSONAJES } from "../src/data/personajes.js";
import { JUEGOS } from "../src/juegos/registro.js";
import { borrarProgreso, leerProgreso } from "../src/lib/progreso.js";

const raiz = (f) => resolve(process.cwd(), f);
const CSS = readFileSync(raiz("src/styles.css"), "utf8") + readFileSync(raiz("src/styles-minijuegos.css"), "utf8");

beforeEach(() => {
  localStorage.clear();
  borrarProgreso();
  document.documentElement.removeAttribute("data-tema");
  window.AudioContext = undefined;
  HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} });
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  Element.prototype.scrollIntoView = function () {};
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

/* ---------- contraste WCAG ---------- */
const lum = (h) => {
  h = h.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** Variables de un bloque de CSS (`:root {` o `:root[data-tema="oscuro"] {`). */
function variables(inicio) {
  const bloque = CSS.slice(CSS.indexOf(inicio)).match(/\{([^}]*)\}/)[1];
  return Object.fromEntries([...bloque.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})\b/gi)].map((m) => [m[1], m[2]]));
}

describe("contraste AA (4.5:1) en los dos temas", () => {
  const claro = variables(":root {");
  const oscuro = { ...claro, ...variables(':root[data-tema="oscuro"] {') };

  for (const [nombre, base, temaDe] of [["claro", claro, "tema"], ["oscuro", oscuro, "temaOscuro"]]) {
    it(`tema ${nombre}: textos sobre superficie y letra blanca sobre los acentos`, () => {
      for (const v of ["texto-suave", "texto-tenue", "bien", "mal", "oro-texto", "tecnito-texto", "green-texto"]) {
        expect(contraste(base[v], base.superficie), `${v} sobre superficie`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contraste(base.bien, base["bien-suave"])).toBeGreaterThanOrEqual(4.5);
      expect(contraste(base.mal, base["mal-suave"])).toBeGreaterThanOrEqual(4.5);
      expect(contraste(base["sobre-estado"], base.bien)).toBeGreaterThanOrEqual(4.5);

      for (const p of Object.values(PERSONAJES)) {
        const t = p[temaDe];
        expect(contraste("#ffffff", t.acento), `${p.id}: blanco sobre acento`).toBeGreaterThanOrEqual(4.5);
        expect(contraste("#ffffff", t.acento2), `${p.id}: blanco sobre acento2`).toBeGreaterThanOrEqual(4.5);
        expect(contraste(t.tinta, t.fondo), `${p.id}: tinta sobre fondo`).toBeGreaterThanOrEqual(4.5);
        expect(contraste(t["acento-texto"], base.superficie), `${p.id}: acento como letra`).toBeGreaterThanOrEqual(4.5);
        expect(contraste(t["acento2-texto"], base.superficie), `${p.id}: acento2 como letra`).toBeGreaterThanOrEqual(4.5);
        if (nombre === "oscuro") expect(contraste(t.tinta, base.superficie)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

describe("fuente redondeada dentro del proyecto", () => {
  it("Nunito se sirve desde src/fuentes con su licencia, sin Google Fonts", () => {
    expect(CSS).toMatch(/@font-face\s*\{[^}]*font-family:\s*"Nunito"/);
    expect(CSS).toContain('url("./fuentes/nunito-variable.woff2")');
    expect(existsSync(raiz("src/fuentes/nunito-variable.woff2"))).toBe(true);
    expect(existsSync(raiz("src/fuentes/OFL-Nunito.txt"))).toBe(true);
    expect(CSS).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
    expect(readFileSync(raiz("index.html"), "utf8")).not.toMatch(/fonts\.googleapis/);
  });
});

describe("iconos propios en la interfaz", () => {
  it("el HUD usa corazones, sonido y moneda en SVG, sin emojis", () => {
    const p = PERSONAJES.green;
    render(
      <Juego personaje={p} grado="primaria" mision={p.misiones[0]} nivel={0} puntos={10} vidas={2} racha={3}
        temblor={false} sonidoOn onSonido={() => {}} onPuntos={() => {}} onFallo={() => {}} onFinMision={() => {}} onSalir={() => {}} />
    );
    const hud = document.querySelector(".hud");
    expect(hud.querySelectorAll(".vida--llena").length).toBe(2);
    expect(hud.querySelectorAll(".vida--vacia").length).toBe(1);
    expect(hud.querySelector(".icono--sonido")).toBeTruthy();
    expect(hud.querySelector(".marcador .icono--brote")).toBeTruthy();
    expect(hud.querySelector(".racha .icono--fuego")).toBeTruthy();
    expect(hud.textContent).not.toMatch(/[❤🖤🔊🔇🔥🌱🛡]/u);
    expect(screen.getByLabelText("2 vidas")).toBeTruthy();
  });
});

describe("Centro compacto", () => {
  it("las tarjetas solo llevan icono, nombre y avance; la descripción queda para lectores de pantalla", () => {
    render(<Centro progreso={leerProgreso()} onJugar={() => {}} onSalir={() => {}} />);
    const tarjetas = [...document.querySelectorAll(".tarjeta")];
    expect(tarjetas.length).toBeGreaterThan(8);
    expect(document.querySelector(".tarjeta__desc")).toBeNull();
    const abierta = tarjetas.find((t) => !t.disabled);
    const juego = JUEGOS.find((j) => abierta.textContent.includes(j.nombre));
    expect(abierta.getAttribute("aria-label")).toContain(juego.descripcion);
    expect(document.querySelectorAll(".tarjeta .punto-dif").length).toBeGreaterThan(0);
    expect(document.querySelector(".pestanas")).toBeTruthy();
  });
});

describe("festejo final", () => {
  const p = PERSONAJES.sismo;
  const props = { personaje: p, insignias: ["Uno", "Dos"], onRepetir() {}, onOtro() {}, onCentro() {}, onInicio() {} };

  it("estrellas según el rango", () => {
    expect(estrellasPara(0)).toBe(0);
    expect(estrellasPara(130)).toBe(1);
    expect(estrellasPara(250)).toBe(2);
    expect(estrellasPara(999)).toBe(3);
  });

  it("los puntos cuentan desde cero, salen las estrellas y el listón de récord", () => {
    vi.useFakeTimers();
    render(<Final {...props} puntos={250} record={{ nuevoRecord: true, recordAnterior: 100 }} />);
    const h2 = document.querySelector(".final h2");
    expect(h2.getAttribute("aria-label")).toBe("250 escudos");
    expect(h2.textContent).toBe("0 escudos");
    act(() => { vi.advanceTimersByTime(600); });
    const aMitad = parseInt(h2.textContent, 10);
    expect(aMitad).toBeGreaterThan(0);
    expect(aMitad).toBeLessThan(250);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(h2.textContent).toBe("250 escudos");
    expect(document.querySelectorAll(".final__estrella--ganada").length).toBe(2);
    expect(screen.getByLabelText("2 de 3 estrellas")).toBeTruthy();
    expect(document.querySelector(".final__liston").textContent).toContain("¡Récord nuevo!");
    expect(document.querySelectorAll(".insignias li").length).toBe(2);
  });

  it("con menos movimiento, el total aparece de inmediato", () => {
    window.matchMedia = (q) => ({ matches: q.includes("reduce"), addListener() {}, removeListener() {} });
    render(<Final {...props} puntos={120} record={{ nuevoRecord: false, recordAnterior: 300 }} />);
    expect(document.querySelector(".final h2").textContent).toBe("120 escudos");
    expect(document.querySelector(".final__liston")).toBeNull();
  });
});

describe("tema oscuro", () => {
  it("el botón cambia el tema, lo recuerda y pone los colores oscuros", () => {
    render(<App />);
    expect(document.documentElement.dataset.tema).toBe("claro");
    fireEvent.click(screen.getByLabelText("Cambiar a tema oscuro"));
    expect(document.documentElement.dataset.tema).toBe("oscuro");
    expect(localStorage.getItem("escuadron-tema")).toBe("oscuro");
    expect(document.documentElement.style.getPropertyValue("--tinta")).toBe("#e8f1fa");
    fireEvent.click(screen.getByLabelText("Cambiar a tema claro"));
    expect(document.documentElement.dataset.tema).toBe("claro");
    expect(document.documentElement.style.getPropertyValue("--tinta")).toBe("#10304f");
  });

  it("sin elección guardada sigue al sistema", () => {
    window.matchMedia = (q) => ({ matches: q.includes("dark"), addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    render(<App />);
    expect(document.documentElement.dataset.tema).toBe("oscuro");
  });

  it("cada personaje tiene su versión oscura con las mismas llaves", () => {
    for (const p of Object.values(PERSONAJES)) {
      expect(Object.keys(p.temaOscuro).sort()).toEqual(Object.keys(p.tema).sort());
    }
  });
});
