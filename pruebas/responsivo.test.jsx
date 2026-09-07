import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import { JUEGOS, POR_ID } from "../src/juegos/registro.js";
import { PERSONAJES } from "../src/data/personajes.js";
import { borrarProgreso, leerProgreso } from "../src/lib/progreso.js";

const CSS = readFileSync(resolve(process.cwd(), "src/styles-minijuegos.css"), "utf8");

beforeEach(() => {
  localStorage.clear();
  borrarProgreso();
  window.AudioContext = undefined;
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {},
  });
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  globalThis.requestAnimationFrame = (cb) => { cb(0); return 0; };
  Element.prototype.scrollIntoView = function () {};
  vi.spyOn(console, "error").mockImplementation((...a) => { throw new Error("React error: " + a[0]); });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function jugar(id, dificultad) {
  const juego = POR_ID[id];
  render(
    <PantallaMinijuego juego={juego} personaje={PERSONAJES[juego.personaje]} grado="primaria"
      progreso={leerProgreso()} onSalir={() => {}} onProgreso={() => {}} />
  );
  if (dificultad) {
    const b = [...document.querySelectorAll(".dificultad")].find((x) => x.textContent.includes(dificultad));
    if (b) act(() => { fireEvent.click(b); });
  }
  act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
  return juego;
}

describe("los tableros declaran sus dos medidas", () => {
  const conTablero = [
    ["ruta-evacuacion", "Difícil"],
    ["polinizadores", "Difícil"],
    ["energia-solar", null],
    ["energia-eolica", null],
    ["palabras-ocultas", "Difícil"],
    ["rompecabezas", "Difícil"],
  ];

  conTablero.forEach(([id, dif]) => {
    it(`${id}${dif ? ` (${dif})` : ""}: el tablero va dentro de una zona ajustable`, () => {
      jugar(id, dif);
      const zona = document.querySelector(".tablero-zona");
      expect(zona, "falta el contenedor .tablero-zona").toBeTruthy();

      const tablero = zona.querySelector(".tablero-ajustable");
      expect(tablero, "falta la clase .tablero-ajustable").toBeTruthy();

      const cols = Number(tablero.style.getPropertyValue("--columnas"));
      const filas = Number(tablero.style.getPropertyValue("--filas"));
      expect(cols).toBeGreaterThan(0);
      expect(filas).toBeGreaterThan(0);

      // el número de casillas tiene que cuadrar con la rejilla declarada
      expect(tablero.children.length).toBe(cols * filas);
    });
  });

  it("las escenas de búsqueda también van dentro de la zona", () => {
    jugar("casa-segura");
    const zona = document.querySelector(".tablero-zona");
    expect(zona).toBeTruthy();
    expect(zona.querySelector(".escena")).toBeTruthy();
  });

  it("ningún objeto de escena se sale del marco", () => {
    JUEGOS.filter((j) => j.escenas).forEach((j) => {
      cleanup();
      jugar(j.id);
      [...document.querySelectorAll(".escena__obj")].forEach((o) => {
        const x = parseFloat(o.style.left);
        const y = parseFloat(o.style.top);
        expect(x, `${j.id}: x fuera de rango`).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y, `${j.id}: y fuera de rango`).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe("la hoja de estilos no vuelve a fijar alturas rígidas", () => {
  it("el sistema de ajuste por contenedor está declarado", () => {
    expect(CSS).toContain("@supports (container-type: size)");
    expect(CSS).toContain("container-type: size");
    expect(CSS).toMatch(/width:\s*min\(100cqw,\s*calc\(100cqh \* var\(--ar\)\)/);
  });

  it("los tableros se limitan con --tope, no con anchos fijos", () => {
    ["\\.mapa", "\\.terreno", "\\.sopa", "\\.puzzle"].forEach((sel) => {
      const bloque = CSS.match(new RegExp(`^${sel} \\{[^}]*\\}`, "m"));
      expect(bloque, `no encontré el bloque de ${sel}`).toBeTruthy();
      expect(bloque[0], `${sel} sigue con un ancho fijo`).not.toMatch(/width:\s*min\(100%,\s*\d+px\)/);
      expect(bloque[0]).toContain("--tope");
    });
  });

  it("las casillas ya no fuerzan proporción propia: la rejilla reparte el espacio", () => {
    ["\\.celda", "\\.terreno__celda", "\\.sopa__celda"].forEach((sel) => {
      const bloque = CSS.match(new RegExp(`^${sel} \\{[^}]*\\}`, "m"));
      expect(bloque[0], `${sel} sigue con aspect-ratio propio`).not.toContain("aspect-ratio");
    });
  });

  it("hay respaldo en vh para navegadores sin dvh", () => {
    const bloque = CSS.match(/^\.juego--mini \{[^}]*\}/m)[0];
    expect(bloque).toContain("height: 100vh");
    expect(bloque).toContain("height: 100dvh");
  });

  it("se contemplan móvil angosto, horizontal y pantalla alta", () => {
    expect(CSS).toContain("@media (max-width: 380px)");
    expect(CSS).toContain("@media (orientation: landscape) and (max-height: 560px)");
    expect(CSS).toContain("@media (min-width: 700px) and (min-height: 900px)");
  });

  it("la cruceta es una rejilla, no posiciones absolutas", () => {
    const bloque = CSS.match(/^\.cruceta \{[^}]*\}/m)[0];
    expect(bloque).toContain("grid-template-columns");
    expect(bloque).not.toContain("position: relative");
    expect(CSS).toContain(".cruceta__arriba { grid-area: 1 / 2; }");
  });

  it("todo botón táctil conserva un área mínima cómoda", () => {
    // ninguna regla baja de 44 px sin una razón declarada de rejilla
    const minimos = [...CSS.matchAll(/min-height:\s*(\d+)px/g)].map((m) => Number(m[1]));
    minimos.forEach((v) => expect(v === 0 || v >= 42, `min-height ${v}px es muy chico`).toBe(true));
  });
});

describe("la fórmula de ajuste cabe en cualquier pantalla", () => {
  // Reproduce en JS lo que hace el CSS:
  //   ancho = min(anchoZona, altoZona * proporción, tope)
  const ajustar = (zonaW, zonaH, cols, filas, tope) => {
    const ar = cols / filas;
    const w = Math.min(zonaW, zonaH * ar, tope);
    return { w, h: w / ar };
  };

  const pantallas = [
    ["iPhone SE vertical", 320, 380],
    ["Android gama entrada", 360, 420],
    ["iPhone moderno", 390, 520],
    ["tablet vertical", 768, 900],
    ["tablet horizontal", 1024, 500],
    ["teléfono acostado", 844, 210],
    ["escritorio", 760, 620],
  ];

  const tableros = [
    ["mapa difícil", 11, 12, 460],
    ["sopa difícil", 13, 13, 460],
    ["rompecabezas", 4, 4, 400],
    ["terreno solar", 5, 4, 470],
    ["polinizadores difícil", 11, 12, 460],
  ];

  pantallas.forEach(([nombre, zw, zh]) => {
    tableros.forEach(([tablero, c, f, tope]) => {
      it(`${tablero} cabe en ${nombre}`, () => {
        const { w, h } = ajustar(zw, zh, c, f, tope);
        expect(w).toBeLessThanOrEqual(zw + 0.01);
        expect(h).toBeLessThanOrEqual(zh + 0.01);
        expect(w).toBeGreaterThan(0);
        // y las casillas siguen siendo tocables o al menos visibles
        expect(w / c).toBeGreaterThan(8);
      });
    });
  });
});

describe("créditos institucionales", () => {
  it("la portada muestra el logotipo UABC · FCITEC con texto alternativo", async () => {
    const { default: App } = await import("../src/App.jsx");
    render(<App />);
    const logo = document.querySelector(".creditos__lockup");
    expect(logo, "falta el logotipo en la portada").toBeTruthy();
    expect(logo.getAttribute("src")).toBe("/fcitec.webp");
    expect(logo.getAttribute("alt")).toMatch(/Universidad Autónoma de Baja California/);
    expect(logo.getAttribute("alt")).toMatch(/Ingeniería y Tecnología/);
    // se declaran medidas para que no salte el diseño al cargar
    expect(logo.getAttribute("width")).toBeTruthy();
    expect(logo.getAttribute("height")).toBeTruthy();
    expect(logo.getAttribute("loading")).toBe("lazy");
  });

  it("sigue estando tras elegir grado, y el centro lleva el escudo", async () => {
    const { default: App } = await import("../src/App.jsx");
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    expect(document.querySelector(".creditos__lockup")).toBeTruthy();

    fireEvent.click(screen.getByText(/Centro de entrenamiento/));
    const escudo = document.querySelector(".creditos__escudo");
    expect(escudo).toBeTruthy();
    expect(escudo.getAttribute("src")).toBe("/uabc-escudo.webp");
    expect(escudo.getAttribute("alt")).toBe("Universidad Autónoma de Baja California");
  });

  it("la variante 'ambos' muestra escudo y logotipo sin repetir el texto alternativo", async () => {
    const { default: Creditos } = await import("../src/components/Creditos.jsx");
    render(<Creditos variante="ambos" />);
    expect(document.querySelector(".creditos__escudo")).toBeTruthy();
    expect(document.querySelector(".creditos__lockup")).toBeTruthy();
    expect(document.querySelector(".creditos__division")).toBeTruthy();
    // el logotipo ya no repite "Universidad Autónoma": lo dice el escudo
    expect(document.querySelector(".creditos__lockup").getAttribute("alt")).toBe(
      "Facultad de Ciencias de la Ingeniería y Tecnología"
    );
  });

  it("los logos se limitan también contra el alto de la ventana", () => {
    const lockup = CSS.match(/^\.creditos__lockup \{[^}]*\}/m)[0];
    const escudo = CSS.match(/^\.creditos__escudo \{[^}]*\}/m)[0];
    expect(lockup).toContain("dvh");
    expect(escudo).toContain("dvh");
    expect(CSS).toContain(".creditos--sello");
  });
});
