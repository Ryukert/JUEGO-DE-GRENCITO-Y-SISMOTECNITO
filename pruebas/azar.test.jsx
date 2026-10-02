import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import Reto from "../src/components/Reto.jsx";
import { POR_ID } from "../src/juegos/registro.js";
import { PERSONAJES } from "../src/data/personajes.js";
import { CONSTRUCCIONES } from "../src/data/juegos/construcciones.js";
import { borrarProgreso, leerProgreso } from "../src/lib/progreso.js";
import { revolver } from "../src/lib/azar.js";

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

function montar(id, dificultad) {
  const juego = POR_ID[id];
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

describe("revolver", () => {
  it("no toca la lista original", () => {
    const lista = [1, 2, 3, 4];
    revolver(lista);
    expect(lista).toEqual([1, 2, 3, 4]);
  });

  it("reparte parejo: las 6 formas de ordenar 3 cosas salen casi igual", () => {
    const cuenta = {};
    const veces = 12000;
    for (let i = 0; i < veces; i++) {
      const llave = revolver(["a", "b", "c"]).join("");
      cuenta[llave] = (cuenta[llave] || 0) + 1;
    }
    expect(Object.keys(cuenta).length).toBe(6);
    Object.values(cuenta).forEach((n) => {
      expect(n).toBeGreaterThan((veces / 6) * 0.85);
      expect(n).toBeLessThan((veces / 6) * 1.15);
    });
  });
});

describe("todo sale al azar", () => {
  it("modo historia: la respuesta buena ya no es siempre la A", () => {
    const mision = PERSONAJES.sismo.misiones[0];
    const buena = mision.opciones.find((o) => o.ok).texto;
    const lugares = new Set();
    for (let i = 0; i < 30; i++) {
      render(
        <Reto personaje={PERSONAJES.sismo} grado="primaria" mision={mision} vidas={3} puntos={0} racha={0}
          onPuntos={() => {}} onFallo={() => {}} onFin={() => {}} />
      );
      const botones = [...document.querySelectorAll(".pie .opciones button")];
      lugares.add(botones.findIndex((b) => b.textContent.includes(buena)));
      cleanup();
    }
    expect(lugares.has(-1)).toBe(false);
    expect(lugares.size).toBeGreaterThan(1);
  });

  it("busca: los objetos cambian de lugar entre partidas", () => {
    const lugares = new Set();
    for (let i = 0; i < 12; i++) {
      montar("casa-segura");
      const primero = [...document.querySelectorAll(".escena__obj")]
        .sort((a, b) => a.getAttribute("aria-label").localeCompare(b.getAttribute("aria-label")))[0];
      lugares.add(`${primero.style.left},${primero.style.top}`);
      cleanup();
    }
    expect(lugares.size).toBeGreaterThan(1);
  });

  it("energía solar: el techo sale en espejo algunas veces, con el norte siempre arriba", () => {
    const tinaco = new Set();
    for (let i = 0; i < 30; i++) {
      montar("energia-solar");
      const celdas = [...document.querySelectorAll(".terreno__celda")].map((c) => c.getAttribute("aria-label"));
      celdas.slice(0, 5).forEach((n) => expect(n).toMatch(/norte/));
      tinaco.add(celdas.findIndex((n) => n === "Tinaco"));
      cleanup();
    }
    expect([...tinaco].sort()).toEqual([5, 9]);
  });
});

describe("construye un edificio", () => {
  const datos = CONSTRUCCIONES["construye-edificio"];
  const etapaPorPregunta = (texto) => datos.etapas.find((e) => e.preguntaCorta === texto || e.pregunta === texto);

  /** Juega todo eligiendo siempre la mejor (o siempre otra) y regresa cómo quedó. */
  function construir(dificultad, bien) {
    vi.useFakeTimers();
    montar("construye-edificio", dificultad);
    for (let i = 0; i < datos.etapas.length; i++) {
      const etapa = etapaPorPregunta(document.querySelector(".quiz__situacion").textContent);
      const mejor = etapa.opciones.reduce((a, b) => (b.solidez > a.solidez ? b : a));
      const botones = [...document.querySelectorAll(".opciones button")];
      const esMejor = (b) => b.textContent.includes(mejor.corto) || b.textContent.includes(mejor.texto);
      act(() => { fireEvent.click(botones.find((b) => (bien ? esMejor(b) : !esMejor(b)))); });
      act(() => { fireEvent.click(screen.getByText(/Siguiente etapa|Simulacro/)); });
    }
    expect(document.querySelector(".edificio--sismo")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(2000); });
  }

  it("fácil: pocas palabras y solo dos opciones grandes", () => {
    montar("construye-edificio");
    const pregunta = document.querySelector(".quiz__situacion").textContent;
    expect(datos.etapas.some((e) => e.preguntaCorta === pregunta)).toBe(true);
    expect(document.querySelectorAll(".opciones--grandes button").length).toBe(2);
    expect(document.querySelector(".mini--lectura")).toBeTruthy();
  });

  it("medio: las tres opciones, con el texto completo", () => {
    montar("construye-edificio", "Medio");
    expect(document.querySelectorAll(".opciones button").length).toBe(3);
    const pregunta = document.querySelector(".quiz__situacion").textContent;
    expect(datos.etapas.some((e) => e.pregunta === pregunta)).toBe(true);
  });

  it("el edificio se dibuja pieza por pieza", () => {
    vi.useFakeTimers();
    montar("construye-edificio", "Medio");
    expect(document.querySelector(".edificio svg")).toBeTruthy();
    expect(document.querySelectorAll(".edificio__pieza").length).toBe(0);
    for (let i = 0; i < 3; i++) {
      act(() => { fireEvent.click(document.querySelector(".opciones button")); });
      act(() => { fireEvent.click(screen.getByText(/Siguiente etapa/)); });
    }
    // suelo, base (si no fue "nada") y columnas ya están en el dibujo
    expect(document.querySelectorAll(".edificio__pieza").length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector(".edificio__plano")).toBeTruthy();
  });

  it("bien construido, aguanta el sismo", () => {
    construir(null, true);
    expect(document.querySelector(".edificio--excelente")).toBeTruthy();
    expect(screen.getByText(/¡Aguantó!/)).toBeTruthy();
    expect(screen.getByText(datos.resultadosCortos.excelente)).toBeTruthy();
    act(() => { fireEvent.click(screen.getByText(/Ver recompensa/)); });
    expect(screen.getByText("¡Reto superado!")).toBeTruthy();
  });

  it("mal construido, se cae", () => {
    construir(null, false);
    expect(document.querySelector(".edificio--malo")).toBeTruthy();
    expect(screen.getByText(/Se cayó/)).toBeTruthy();
  });
});
