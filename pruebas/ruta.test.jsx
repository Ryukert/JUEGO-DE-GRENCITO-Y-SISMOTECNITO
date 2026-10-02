import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import { POR_ID } from "../src/juegos/registro.js";
import { PERSONAJES } from "../src/data/personajes.js";
import { borrarProgreso, leerProgreso } from "../src/lib/progreso.js";
import { RUTAS } from "../src/data/juegos/rutas.js";
import { generarMapa, rutaSegura, voltear } from "../src/lib/laberinto.js";

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
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

function montar(dificultad) {
  const juego = POR_ID["ruta-evacuacion"];
  render(
    <PantallaMinijuego juego={juego} personaje={PERSONAJES[juego.personaje]} grado="primaria"
      progreso={leerProgreso()} onSalir={() => {}} onProgreso={() => {}} />
  );
  if (dificultad) {
    const b = [...document.querySelectorAll(".dificultad")].find((x) => x.textContent.includes(dificultad));
    act(() => { fireEvent.click(b); });
  }
  act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
}

const buscar = (mapa, letra) => {
  for (let y = 0; y < mapa.length; y++) {
    const x = mapa[y].indexOf(letra);
    if (x >= 0) return { x, y };
  }
  return null;
};

const tecla = (key) => act(() => { fireEvent.keyDown(window, { key }); });
const indiceYo = () => [...document.querySelectorAll(".celda")].indexOf(document.querySelector(".celda--yo"));
const vidas = () => document.querySelector(".jm__vidas").textContent.split("❤️").length - 1;

/** Reconstruye el mapa a partir de lo que se ve en pantalla. */
function mapaEnPantalla() {
  const tablero = document.querySelector(".mapa");
  const cols = Number(tablero.style.getPropertyValue("--columnas"));
  const celdas = [...tablero.children];
  const filas = [];
  let yo = null;
  celdas.forEach((c, i) => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    if (x === 0) filas.push("");
    if (c.classList.contains("celda--yo")) yo = { x, y };
    const t = c.textContent;
    const letra = c.classList.contains("celda--muro") ? "#"
      : t.includes("🧱") ? "R" : t.includes("⚠️") ? "X" : t.includes("🛗") ? "T" : t.includes("🟢") ? "S" : ".";
    filas[y] += letra;
  });
  return { mapa: filas, yo };
}

describe("laberintos al azar", () => {
  const niveles = RUTAS["ruta-evacuacion"].slice(1);

  niveles.forEach((nivel) => {
    it(`${nivel.id}: 300 laberintos, todos con salida y con peligros en el camino`, () => {
      const { columnas, filas } = nivel.generar;
      for (let i = 0; i < 300; i++) {
        const mapa = generarMapa(nivel.generar);
        expect(mapa.length).toBe(filas);
        mapa.forEach((f) => expect(f.length).toBe(columnas));
        expect(mapa[0]).toBe("#".repeat(columnas));
        expect(mapa.at(-1)).toBe("#".repeat(columnas));

        const texto = mapa.join("");
        expect(texto.split("J").length - 1).toBe(1);
        expect(texto.split("S").length - 1).toBe(1);

        const ruta = rutaSegura(mapa, buscar(mapa, "J"));
        expect(ruta, mapa.join("\n")).toBeTruthy();
        // no es un paseo: la ruta segura es larga
        expect(ruta.length).toBeGreaterThan(columnas);
        const { peligros, elevadores } = nivel.generar;
        expect((texto.match(/[XT]/g) || []).length, mapa.join("\n")).toBe(peligros + elevadores);
      }
    });
  });

  it("los mapas hechos a mano tienen ruta segura aunque se volteen", () => {
    RUTAS["ruta-evacuacion"][0].forEach((nivel) => {
      [[false, false], [true, false], [false, true], [true, true]].forEach(([h, v]) => {
        const mapa = voltear(nivel.mapa, h, v);
        expect(rutaSegura(mapa, buscar(mapa, "J")), `${nivel.id} ${h} ${v}`).toBeTruthy();
      });
    });
  });
});

describe("ruta de evacuación más difícil", () => {
  it("los peligros tapan el paso: chocar quita una vida una sola vez y no avanza", () => {
    // 0.99 → elige el mapa "edificio" y no lo voltea
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    montar();
    const inicio = indiceYo();
    expect(vidas()).toBe(4);

    // del inicio (1,1) bajando tres casillas se llega junto al elevador (1,5)
    tecla("ArrowDown"); tecla("ArrowDown"); tecla("ArrowDown");
    const junto = indiceYo();
    expect(junto).not.toBe(inicio);

    tecla("ArrowDown");
    expect(indiceYo()).toBe(junto);
    expect(vidas()).toBe(3);
    expect(document.querySelector(".retro")).toBeTruthy();

    act(() => { fireEvent.click(screen.getByText(/Seguir/)); });
    tecla("ArrowDown");
    expect(indiceYo()).toBe(junto);
    expect(vidas()).toBe(3);
    expect(document.querySelector(".celda--golpe")).toBeTruthy();
  });

  it("difícil: sin luz, solo se ve alrededor y la salida brilla", () => {
    montar("Difícil");
    const total = document.querySelectorAll(".celda").length;
    const oscuras = document.querySelectorAll(".celda--oscura").length;
    expect(total).toBe(13 * 13);
    expect(oscuras).toBeGreaterThan(total / 2);
    expect(document.querySelector(".mapa").textContent).toContain("🟢");
    expect(document.querySelector(".cruceta__centro").textContent).toBe("🔦");
  });

  it("medio: las réplicas tiran escombro sin cerrar el último camino", () => {
    vi.useFakeTimers();
    montar("Medio");
    expect(document.querySelectorAll(".celda").length).toBe(11 * 11);
    expect(document.querySelector(".celda__escombro")).toBeNull();

    act(() => { vi.advanceTimersByTime(9500); });
    expect(document.querySelectorAll(".celda__escombro").length).toBeGreaterThan(0);

    const { mapa, yo } = mapaEnPantalla();
    expect(rutaSegura(mapa, yo), mapa.join("\n")).toBeTruthy();
  });

  it("el tiempo sale del largo de la ruta segura, no de un número fijo", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    montar();
    // edificio: 17 pasos × 1.5 s × 1.4 (fácil) = 35.7 s; antes eran 98 s
    expect(document.querySelector(".cronometro__numero").textContent).toBe("36");
  });
});
