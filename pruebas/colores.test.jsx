import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PERSONAJES } from "../src/data/personajes.js";

const CSS = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const CSS_MINI = readFileSync(resolve(process.cwd(), "src/styles-minijuegos.css"), "utf8");
const APP = readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf8");

/* Colores tomados pixel a pixel del escudo de la UABC. */
const UABC = { verde: "#007336", dorado: "#C7940D", azul: "#171796" };

function luminancia(hex) {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const l = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
}

function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function temaNeutro() {
  const bloque = APP.match(/const TEMA_NEUTRO = \{[\s\S]*?\};/)[0];
  const tema = {};
  [...bloque.matchAll(/(\w+):\s*"(#[0-9A-Fa-f]{6})"/g)].forEach((m) => (tema[m[1]] = m[2]));
  return tema;
}

const TEMAS = {
  neutro: temaNeutro(),
  tecnito: PERSONAJES.sismo.tema,
  greencito: PERSONAJES.green.tema,
};

describe("paleta institucional UABC", () => {
  it("los colores del escudo están declarados como variables de marca", () => {
    expect(CSS).toContain(`--uabc-verde: ${UABC.verde}`);
    expect(CSS).toContain(`--uabc-dorado: ${UABC.dorado}`);
    expect(CSS).toContain(`--uabc-azul: ${UABC.azul}`);
  });

  it("los dos personajes usan la pareja verde/dorado de la UABC", () => {
    const t = TEMAS.tecnito;
    const g = TEMAS.greencito;
    // papeles cambiados: el acento de uno es el acento2 del otro
    expect(t.acento).toBe(g.acento2);
    expect(t.acento2).toBe(g.acento);
    expect([t.acento, t.acento2].sort()).toEqual(["#007336", "#8A6608"]);
  });

  it("no quedó ningún azul ni naranja del diseño anterior", () => {
    const viejos = ["#0f6fc4", "#f4691f", "#5aa32a", "#d98430", "#10304f", "#8fb6dd", "#6b4fa8"];
    viejos.forEach((c) => {
      expect(CSS.toLowerCase(), `${c} sigue en styles.css`).not.toContain(c);
      expect(CSS_MINI.toLowerCase(), `${c} sigue en styles-minijuegos.css`).not.toContain(c);
      Object.entries(TEMAS).forEach(([nombre, t]) => {
        expect(Object.values(t).map((v) => v.toLowerCase()), `${c} sigue en el tema ${nombre}`)
          .not.toContain(c);
      });
    });
  });
});

describe("contraste accesible (WCAG AA, mínimo 4.5)", () => {
  Object.entries(TEMAS).forEach(([nombre, t]) => {
    it(`${nombre}: texto blanco sobre el color de acento`, () => {
      expect(contraste("#FFFFFF", t.acento)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${nombre}: la tinta se lee sobre los dos tonos de fondo`, () => {
      expect(contraste(t.tinta, t.fondo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t.tinta, t.fondo2)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t.tinta, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    });

    it(`${nombre}: los acentos sirven como texto sobre blanco`, () => {
      // acento2 se usa como color de texto en récords y puntos ganados
      expect(contraste(t.acento2, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t.acento, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("el dorado puro no se usa donde haga falta contraste", () => {
    // #C7940D da 2.74 contra blanco: solo vale para adornos
    expect(contraste(UABC.dorado, "#FFFFFF")).toBeLessThan(4.5);
    Object.values(TEMAS).forEach((t) => {
      expect(t.acento).not.toBe(UABC.dorado);
      expect(t.acento2).not.toBe(UABC.dorado);
      expect(t.tinta).not.toBe(UABC.dorado);
    });
  });

  it("los grises de apoyo y los colores de acierto y error también cumplen", () => {
    ["#5B6B60", "#4A5B52", "#007336", "#C9432C"].forEach((c) => {
      expect(contraste(c, "#FFFFFF"), `${c} no llega a 4.5`).toBeGreaterThanOrEqual(4.5);
    });
  });
});
