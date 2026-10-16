/* Pantalla de misión: personaje en escena que reacciona, reloj visible que cambia de color,
   y textos de la portada que salen del contenido real. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import Reto from "../src/components/Reto.jsx";
import Portada from "../src/components/Portada.jsx";
import { PERSONAJES, GRADOS } from "../src/data/personajes.js";
import { JUEGOS } from "../src/juegos/registro.js";
import { leerProgreso } from "../src/lib/progreso.js";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  window.AudioContext = undefined;
  HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} });
  window.matchMedia = (q) => ({ matches: false, addListener() {}, removeListener() {} });
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  Element.prototype.scrollIntoView = function () {};
  global.fetch = vi.fn(async () => ({ ok: false, json: async () => ({}) }));   // sin chat
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const p = PERSONAJES.sismo;
const mision = p.misiones.find((m) => m.tipo === "reto");
function montar() {
  render(<Reto personaje={p} grado="primaria" mision={mision} vidas={3} puntos={0} racha={0} onPuntos={() => {}} onFallo={() => {}} onFin={() => {}} />);
}
const personaje = () => document.querySelector(".mision-escena__personaje");
const reloj = () => document.querySelector(".reloj");

describe("misión", () => {
  it("el personaje aparece en grande en la escena, con el lugar de la misión", () => {
    montar();
    expect(personaje().querySelector("img").getAttribute("src")).toBe(p.cuerpo);
    expect(personaje().className).toMatch(/--piensa/);
    expect(screen.getByText("📍 " + mision.lugar)).toBeTruthy();
  });

  it("reacciona: feliz al acertar, triste al fallar", () => {
    montar();
    const buena = mision.opciones.find((o) => o.ok).texto;
    act(() => { fireEvent.click(screen.getByText(buena)); });
    expect(personaje().className).toMatch(/--feliz/);
    expect(screen.getByText("¡Bien!")).toBeTruthy();
    cleanup();
    montar();
    const mala = mision.opciones.find((o) => !o.ok).texto;
    act(() => { fireEvent.click(screen.getByText(mala)); });
    expect(personaje().className).toMatch(/--triste/);
  });

  it("el reloj se ve grande y pasa de verde a amarillo y a rojo; al acabarse, el personaje lo nota", () => {
    montar();
    const s = GRADOS.primaria.segundos;
    expect(reloj().className).toMatch(/reloj--verde/);
    expect(reloj().getAttribute("role")).toBe("timer");
    expect(document.querySelector(".reloj__numero b").textContent).toBe(String(s));
    act(() => { vi.advanceTimersByTime((s / 2 + 1) * 1000); });
    expect(reloj().className).toMatch(/reloj--amarillo/);
    act(() => { vi.advanceTimersByTime((s / 2 - 5) * 1000); });
    expect(reloj().className).toMatch(/reloj--rojo/);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(personaje().className).toMatch(/--tiempo/);
    expect(reloj()).toBeNull();
  });
});

describe("portada", () => {
  it("los números salen del contenido: misiones, vidas y minijuegos", () => {
    render(<Portada progreso={leerProgreso()} onElegir={() => {}} onCentro={() => {}} />);
    const texto = document.body.textContent;
    expect(p.misiones.length).toBe(5);
    expect(texto).toContain("Cinco misiones, tres vidas");
    expect(texto).toContain(`hay ${JUEGOS.length} minijuegos`);
    act(() => { fireEvent.click(screen.getByText("Primaria")); });
    expect(document.body.textContent).toContain("Cada partida son cinco misiones seguidas");
  });
});
