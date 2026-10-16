/* Insignias propias de los 46 juegos, medallas de rango y emojis que se ven en equipos viejos. */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import IconoJuego, { IconoRango, JUEGOS_CON_DIBUJO, COLOR_CATEGORIA } from "../src/components/IconoJuego.jsx";
import { JUEGOS } from "../src/juegos/registro.js";
import { RANGOS } from "../src/lib/progreso.js";

afterEach(cleanup);

describe("insignias de los minijuegos", () => {
  it("cada juego del catálogo tiene su dibujo y su categoría tiene color", () => {
    const sinDibujo = JUEGOS.filter((j) => !JUEGOS_CON_DIBUJO.includes(j.id)).map((j) => j.id);
    expect(sinDibujo).toEqual([]);
    const sinColor = [...new Set(JUEGOS.map((j) => j.categoria))].filter((c) => !COLOR_CATEGORIA[c]);
    expect(sinColor).toEqual([]);
  });

  it("ningún juego repite dibujo", () => {
    const dibujos = JUEGOS.map((j) => {
      const { container } = render(<IconoJuego juego={j} />);
      const html = container.querySelector(".insignia__dibujo").innerHTML;
      cleanup();
      return html;
    });
    expect(new Set(dibujos).size).toBe(JUEGOS.length);
  });

  it("se pinta con el color de su categoría y los jefes llevan corona", () => {
    const jefe = JUEGOS.find((j) => j.categoria === "Jefes finales");
    const { container } = render(<IconoJuego juego={jefe} />);
    const svg = container.querySelector("svg.insignia");
    expect(svg.style.getPropertyValue("--c")).toBe(COLOR_CATEGORIA["Jefes finales"]);
    expect(svg.querySelector(".insignia__corona")).toBeTruthy();
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("los colores de categoría dejan ver el dibujo blanco (3:1 o más)", () => {
    const lum = (h) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const [cat, c] of Object.entries(COLOR_CATEGORIA)) {
      expect(1.05 / (lum(c) + 0.05), cat).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("medallas de rango", () => {
  it("cada rango tiene medalla distinta y Leyenda lleva corona", () => {
    const dibujos = RANGOS.map((r) => {
      const { container } = render(<IconoRango rango={r} />);
      const html = container.innerHTML;
      cleanup();
      return html;
    });
    expect(new Set(dibujos).size).toBe(RANGOS.length);
  });
});

describe("emojis del contenido", () => {
  // Emoji 12 (2019) en adelante y secuencias unidas (ZWJ): en equipos viejos salen como cuadritos
  const NUEVOS = [
    [0x1fa70, 0x1faff], [0x1f6d5, 0x1f6df], [0x1f6fa, 0x1f6ff], [0x1f7e0, 0x1f7eb],
    [0x1f90c, 0x1f90f], [0x1f93f, 0x1f93f], [0x1f971, 0x1f972], [0x1f977, 0x1f979],
    [0x1f97b, 0x1f97b], [0x1f9a5, 0x1f9af], [0x1f9ba, 0x1f9bf], [0x1f9c3, 0x1f9cf],
  ];
  const archivos = [];
  (function recorrer(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) recorrer(p);
      else if (/\.(js|jsx)$/.test(f)) archivos.push(p);
    }
  })(resolve(process.cwd(), "src"));

  it("solo se usan emojis que se ven en teléfonos y computadoras de antes de 2019", () => {
    const problemas = [];
    for (const f of archivos) {
      const texto = readFileSync(f, "utf8");
      for (const [e] of texto.matchAll(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/gu)) {
        const n = e.codePointAt(0);
        if (e.includes("‍") || NUEVOS.some(([a, b]) => n >= a && n <= b)) problemas.push(`${e} en ${f.split(/[\\/]src[\\/]/)[1]}`);
      }
    }
    expect(problemas).toEqual([]);
  });
});
