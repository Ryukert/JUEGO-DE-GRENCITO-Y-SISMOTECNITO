/* «¿Quién juega?»: varios niños en la computadora del salón, cada uno con su nombre, su ID y su
   propio progreso, sin registrarse. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import React from "react";
import App from "../src/App.jsx";
import {
  crearJugador, elegirJugador, jugarSinNombre, borrarJugador, listarJugadores, jugadorActual,
  limpiarNombre, nuevoId, restaurarJugador, reiniciarJugadores,
} from "../src/lib/jugadores.js";
import { leerProgreso, registrarMinijuego, borrarProgreso, usarCuenta } from "../src/lib/progreso.js";
import { reiniciarCuenta } from "../src/lib/cuenta.js";
import { reiniciarPreferencias } from "../src/lib/preferencias.js";
import { reiniciarChat } from "../src/lib/chat.js";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  reiniciarJugadores();
  reiniciarCuenta();
  usarCuenta(null);
  borrarProgreso();
  reiniciarPreferencias();
  reiniciarChat();
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  window.AudioContext = undefined;
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ disponible: false }) }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const jugar = (xp) => registrarMinijuego("memorama", { score: xp, xp, completed: true, dificultad: "facil" });

describe("jugadores de una computadora compartida", () => {
  it("el ID son 6 letras y números fáciles de dictar, y no se repite", () => {
    const ids = Array.from({ length: 300 }, () => nuevoId());
    ids.forEach((id) => expect(id).toMatch(/^[A-HJ-NP-Z2-9]{6}$/));
    expect(new Set(ids).size).toBe(300);
    expect(nuevoId(["AAAAAA"])).not.toBe("AAAAAA");
  });

  it("acepta nombres con acentos y ñ, y rechaza los vacíos o con símbolos", () => {
    expect(limpiarNombre("  Iñaki   Pérez ")).toBe("Iñaki Pérez");
    expect(limpiarNombre("O'Neil Ruiz-Gómez")).toBe("O'Neil Ruiz-Gómez");
    expect(limpiarNombre("a")).toBeNull();
    expect(limpiarNombre("<script>")).toBeNull();
    expect(limpiarNombre("x".repeat(31))).toBeNull();
  });

  it("cada niño guarda su propio progreso; «sin nombre» tiene el suyo", () => {
    jugar(10);                                     // sin nombre
    const ana = crearJugador("Ana");
    expect(leerProgreso().xp).toBe(0);
    jugar(70);
    const beto = crearJugador("Beto", "green");
    expect(leerProgreso().xp).toBe(0);
    jugar(30);
    elegirJugador(ana.id);
    expect(leerProgreso().xp).toBe(70);
    jugarSinNombre();
    expect(leerProgreso().xp).toBe(10);
    elegirJugador(beto.id);
    expect(leerProgreso().xp).toBe(30);
    expect(jugadorActual()).toMatchObject({ nombre: "Beto", avatar: "green" });
  });

  it("no deja dos nombres iguales (sin importar mayúsculas ni acentos)", () => {
    crearJugador("Ana López");
    expect(() => crearJugador("ana lopez")).toThrow(/Ya hay alguien/);
    expect(listarJugadores()).toHaveLength(1);
  });

  it("quién juega se olvida al cerrar el navegador, pero los nombres y su progreso se quedan", () => {
    const ana = crearJugador("Ana");
    jugar(50);
    sessionStorage.clear();                        // se cerró el navegador
    expect(jugadorActual()).toBeNull();
    restaurarJugador();
    expect(leerProgreso().xp).toBe(0);             // abre en «sin nombre»
    elegirJugador(ana.id);
    expect(leerProgreso().xp).toBe(50);
  });

  it("borrar a un jugador quita su nombre y su progreso", () => {
    const ana = crearJugador("Ana");
    jugar(50);
    borrarJugador(ana.id);
    expect(listarJugadores()).toEqual([]);
    expect(jugadorActual()).toBeNull();
    expect(localStorage.getItem(`escuadron-progreso-v2:jugador-${ana.id}`)).toBeNull();
  });
});

describe("pantalla «¿Quién juega?»", () => {
  it("el primer niño escribe su nombre, ve su ID y la portada lo muestra", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Quién juega/ }));
    const dialogo = screen.getByRole("dialog", { name: /Quién juega/ });
    fireEvent.change(within(dialogo).getByLabelText(/Tu nombre/), { target: { value: "Ana López" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Empezar a jugar" }));
    const id = jugadorActual().id;
    const listo = screen.getByRole("dialog", { name: /Listo/ });
    expect(within(listo).getByText(id)).toBeTruthy();
    fireEvent.click(within(listo).getByRole("button", { name: /A jugar/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: new RegExp(`Juega Ana López, ID ${id}`) })).toBeTruthy();
  });

  it("al volver a abrir el juego pregunta quién juega y se elige tocando el nombre", () => {
    const ana = crearJugador("Ana");
    crearJugador("Beto");
    sessionStorage.clear();
    restaurarJugador();
    render(<App />);
    const dialogo = screen.getByRole("dialog", { name: /Quién juega/ });
    fireEvent.click(within(dialogo).getByRole("button", { name: /Ana/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(jugadorActual().id).toBe(ana.id);
  });

  it("la primera vez en una computadora nueva no estorba: solo aparece el botón", () => {
    render(<App />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Quién juega/ })).toBeTruthy();
  });

  it("se puede jugar sin nombre", () => {
    crearJugador("Ana");
    sessionStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Jugar sin nombre" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(jugadorActual()).toBeNull();
  });
});
