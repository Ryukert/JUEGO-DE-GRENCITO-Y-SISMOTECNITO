import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import App from "../src/App.jsx";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import { JUEGOS } from "../src/juegos/registro.js";
import { PERSONAJES } from "../src/data/personajes.js";
import { borrarProgreso, leerProgreso } from "../src/lib/progreso.js";

// Web Audio y canvas no existen en jsdom: los silenciamos.
beforeEach(() => {
  localStorage.clear();
  borrarProgreso();
  window.AudioContext = undefined;
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {},
  });
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, addListener() {}, removeListener() {} }));
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  Element.prototype.scrollIntoView = function () {}; // jsdom no lo trae
  vi.spyOn(console, "error").mockImplementation((...a) => { throw new Error("React error: " + a[0]); });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("cada minijuego del catálogo se monta y responde", () => {
  JUEGOS.forEach((juego) => {
    it(`${juego.id} arranca sin errores`, () => {
      render(
        <PantallaMinijuego
          juego={juego}
          personaje={PERSONAJES[juego.personaje]}
          grado="primaria"
          progreso={leerProgreso()}
          onSalir={() => {}}
          onProgreso={() => {}}
        />
      );
      // pantalla de instrucciones
      expect(screen.getByText(/¡Empezar!/)).toBeTruthy();
      act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
      // ya está montado el motor: debe haber algo interactivo
      expect(document.querySelectorAll("button").length).toBeGreaterThan(0);
    });
  });
});

describe("flujo original", () => {
  it("la portada, el grado y la primera misión siguen funcionando", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    fireEvent.click(screen.getByText("Sismo Tecnito"));
    expect(screen.getByText(/El salón se mueve/)).toBeTruthy();
  });

  it("se llega al Centro de entrenamiento desde la portada", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    fireEvent.click(screen.getByText(/Centro de entrenamiento/));
    expect(screen.getByText(/Centro de entrenamiento/)).toBeTruthy();
    expect(screen.getByText("Casa segura")).toBeTruthy();
  });
});
