/* «¿Quién juega?»: varios niños en la computadora del salón, cada uno con su nombre, su ID y su
   propio progreso, sin registrarse. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, act } from "@testing-library/react";
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
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Jugar sin nombre" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(jugadorActual()).toBeNull();
  });
});

describe("tarjeta grande de la portada para escribir el nombre", () => {
  it("es lo primero que se ve: el niño escribe su nombre ahí mismo y lo saluda con su ID", () => {
    render(<App />);
    const tarjeta = screen.getByRole("region", { name: /Cómo te llamas/ });
    const campo = within(tarjeta).getByLabelText(/Escribe tu nombre aquí/);
    expect(within(tarjeta).getByRole("button", { name: "¡Listo!" }).disabled).toBe(true);
    fireEvent.change(campo, { target: { value: "Sofía" } });
    fireEvent.click(within(tarjeta).getByRole("button", { name: "¡Listo!" }));
    const hola = screen.getByRole("region", { name: "Quién está jugando" });
    expect(hola.textContent).toContain("¡Hola, Sofía!");
    expect(hola.textContent).toContain(jugadorActual().id);
    expect(hola.textContent).toContain("anótalo");
  });

  it("muestra los nombres de quienes ya jugaron para tocarlos", () => {
    const beto = crearJugador("Beto");
    sessionStorage.clear();
    restaurarJugador();
    render(<App />);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Jugar sin nombre" }));
    // «Jugar sin nombre» en la ventana no esconde la tarjeta: sigue a la vista con los nombres
    const tarjeta = screen.getByRole("region", { name: /Cómo te llamas/ });
    fireEvent.click(within(tarjeta).getByRole("button", { name: /Beto/ }));
    expect(jugadorActual().id).toBe(beto.id);
    expect(screen.getByRole("region", { name: "Quién está jugando" }).textContent).toContain("Beto");
  });

  it("«No soy…» abre la lista para cambiar de jugador", () => {
    crearJugador("Ana");
    marcarParaNoPreguntar();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "No soy Ana" }));
    expect(screen.getByRole("dialog", { name: /Quién juega/ })).toBeTruthy();
  });

  it("«Jugar sin nombre» la quita por esta visita", () => {
    render(<App />);
    const tarjeta = screen.getByRole("region", { name: /Cómo te llamas/ });
    fireEvent.click(within(tarjeta).getByRole("button", { name: "Jugar sin nombre" }));
    expect(screen.queryByRole("region", { name: /Cómo te llamas/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Quién juega/ })).toBeTruthy();
  });
});

function marcarParaNoPreguntar() {
  sessionStorage.setItem("escuadron-quien-preguntado", "true");
}

describe("reinicio por inactividad (computadora del salón)", () => {
  afterEach(() => vi.useRealTimers());

  it("a los 4:30 sin tocar avisa, y a los 5 minutos vuelve al inicio pidiendo el nombre", () => {
    vi.useFakeTimers();
    const ana = crearJugador("Ana");
    marcarParaNoPreguntar();
    render(<App />);
    expect(screen.getByRole("region", { name: "Quién está jugando" })).toBeTruthy();
    // entra al Centro: el reinicio también lo saca de ahí
    fireEvent.click(screen.getAllByRole("button", { name: /Centro de entrenamiento/ })[0]);
    act(() => vi.advanceTimersByTime(4 * 60_000 + 31_000));
    const aviso = screen.getByRole("alertdialog", { name: /Sigues jugando, Ana/ });
    expect(aviso).toBeTruthy();
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(jugadorActual()).toBeNull();
    expect(screen.getByRole("region", { name: /Cómo te llamas/ })).toBeTruthy();
    // su progreso no se borró: sigue en la lista para tocar su nombre
    expect(within(screen.getByRole("region", { name: /Cómo te llamas/ })).getByRole("button", { name: /Ana/ })).toBeTruthy();
    expect(listarJugadores().map((j) => j.id)).toEqual([ana.id]);
  });

  it("si el niño toca la pantalla durante el aviso, sigue jugando", () => {
    vi.useFakeTimers();
    crearJugador("Ana");
    marcarParaNoPreguntar();
    render(<App />);
    act(() => vi.advanceTimersByTime(4 * 60_000 + 31_000));
    fireEvent.pointerDown(screen.getByRole("button", { name: /Sigo aquí/ }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    act(() => vi.advanceTimersByTime(60_000));
    expect(jugadorActual()?.nombre).toBe("Ana");
  });

  it("mientras toca la pantalla no se reinicia", () => {
    vi.useFakeTimers();
    crearJugador("Ana");
    marcarParaNoPreguntar();
    render(<App />);
    for (let i = 0; i < 10; i++) {
      act(() => vi.advanceTimersByTime(60_000));
      fireEvent.keyDown(window, { key: "x" });
    }
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(jugadorActual()?.nombre).toBe("Ana");
  });
});
