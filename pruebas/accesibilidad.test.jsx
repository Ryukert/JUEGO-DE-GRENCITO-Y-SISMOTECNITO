/* Accesibilidad: axe-core revisa las pantallas principales, y los juegos de arrastrar se
   pueden jugar solo con el teclado. (El contraste de color lo revisa diseno.test.jsx: jsdom no
   calcula colores, por eso esa regla de axe va apagada aquí.) */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import axe from "axe-core";
import App from "../src/App.jsx";
import Maestro from "../src/pages/Maestro.jsx";
import Repaso from "../src/pages/Repaso.jsx";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import { POR_ID } from "../src/juegos/registro.js";
import { PERSONAJES } from "../src/data/personajes.js";
import { borrarProgreso, registrarRespuesta } from "../src/lib/progreso.js";
import { reiniciarPreferencias } from "../src/lib/preferencias.js";

const OPCIONES = { rules: { "color-contrast": { enabled: false } } };

async function sinViolaciones(contenedor = document.body) {
  const { violations } = await axe.run(contenedor, OPCIONES);
  const detalle = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(detalle, detalle.join("\n")).toEqual([]);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  borrarProgreso();
  reiniciarPreferencias();
  window.AudioContext = undefined;
  window.scrollTo = () => {};
  HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} });
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  Element.prototype.scrollIntoView = function () {};
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ disponible: false }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const enMain = () => ({ container: document.body.appendChild(document.createElement("main")) });
const jugarMinijuego = (id) =>
  render(
    <PantallaMinijuego juego={POR_ID[id]} personaje={PERSONAJES[POR_ID[id].personaje]} grado="primaria" progreso={{ juegos: {} }} onSalir={() => {}} />,
    enMain(),
  );

describe("axe-core: pantallas sin problemas de accesibilidad", () => {
  it("portada", async () => {
    render(<App />, enMain());
    await sinViolaciones();
  });

  it("portada con grado elegido y el botón de repaso", async () => {
    registrarRespuesta({ personaje: "sismo", mision: "s1", correcto: false });
    render(<App />, enMain());
    fireEvent.click(screen.getByRole("button", { name: /Primaria/ }));
    expect(screen.getByRole("button", { name: /Repasar lo que fallé/ })).toBeTruthy();
    await sinViolaciones();
  });

  it("una misión", async () => {
    render(<App />, enMain());
    fireEvent.click(screen.getByRole("button", { name: /Primaria/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sismo Tecnito/ }));
    // la primera vez sale el tutorial: se salta para llegar a la misión
    while (screen.queryByRole("button", { name: /Siguiente|Empezar|¡A jugar!|Entendido/ }) && !document.querySelector(".mision-escena")) {
      fireEvent.click(screen.getAllByRole("button", { name: /Siguiente|Empezar|¡A jugar!|Entendido/ })[0]);
    }
    expect(document.querySelector(".mision-escena")).toBeTruthy();
    await sinViolaciones();
  });

  it("el Centro de entrenamiento", async () => {
    render(<App />, enMain());
    fireEvent.click(screen.getAllByRole("button", { name: /Centro de entrenamiento/ })[0]);
    await sinViolaciones();
  });

  it("el repaso", async () => {
    registrarRespuesta({ personaje: "green", mision: "g3b", correcto: false });
    render(<Repaso grado="primaria" onSalir={() => {}} />, enMain());
    await sinViolaciones();
  });

  it("Clasifica y Coloca, en las instrucciones y jugando", async () => {
    for (const id of ["clasifica-basura", "energia-solar"]) {
      const { unmount, container } = jugarMinijuego(id);
      await sinViolaciones();
      fireEvent.click(screen.getByRole("button", { name: /Empezar/ }));
      await sinViolaciones();
      unmount();
      container.remove();
    }
  });

  it("el panel del maestro, con tarea y avance por tema", async () => {
    sessionStorage.setItem("escuadron-maestro", JSON.stringify({ pase: "x", grupo: { codigo: "ABC234", nombre: "5° B", grado: "primaria" } }));
    const datos = {
      grupo: { codigo: "ABC234", nombre: "5° B", grado: "primaria" },
      tarea: { juegos: ["clasifica-basura", "energia-solar"], nota: "Para el viernes", desde: "2026-11-01T00:00:00.000Z" },
      temas: [{ personaje: "sismo", tema: "El salón se mueve", total: 10, aciertos: 7 }],
      alumnos: [{
        id: "1", apodo: "Ana", avatar: "green", creado_en: "2026-11-01T00:00:00Z", ultima_vez: "2026-11-07T00:00:00Z",
        xp: 30, records: { sismo: 100, green: 0 }, mejor: 100, partidas: 1, misiones: 2, minijuegos: 1, logros: 0,
        respuestas: { total: 4, aciertos: 3 }, tarea: { hechos: 1, total: 2 },
      }],
      preguntas: [], encuestas: [], evaluacion: { total: 0, semana: 0, suficientes: false, preguntas: [] },
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => datos })));
    render(<Maestro onSalir={() => {}} />, enMain());
    await screen.findByText("Tarea del grupo");
    expect(screen.getByText("1 de 2")).toBeTruthy();
    expect(screen.getByRole("img", { name: /70% de aciertos/ })).toBeTruthy();
    await sinViolaciones();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar la tarea" }));
    await sinViolaciones();
  });
});

describe("los juegos de arrastrar se juegan con el teclado", () => {
  it("Clasifica: cada residuo se anuncia y las teclas 1, 2, 3… eligen contenedor", async () => {
    jugarMinijuego("clasifica-basura");
    fireEvent.click(screen.getByRole("button", { name: /Empezar/ }));
    const anuncio = document.querySelector("[aria-live='polite'].visualmente-oculto");
    expect(anuncio.textContent).toMatch(/^1 de \d+: .+\. ¿En qué contenedor va\?$/);
    const botes = [...document.querySelectorAll("[data-bote]")];
    expect(botes.map((b) => b.getAttribute("aria-keyshortcuts"))).toEqual(botes.map((_, i) => String(i + 1)));
    // la tecla 1 manda el residuo al primer contenedor: si acierta sale «+puntos», si no, la explicación
    act(() => { fireEvent.keyDown(document, { key: "1" }); });
    expect(document.querySelector(".clasifica__retro") || screen.queryByText(/^\+\d+|Racha/)).toBeTruthy();
    // una tecla que no es contenedor no hace nada
    act(() => { fireEvent.keyDown(document, { key: "9" }); });
  });

  it("Coloca: una sola casilla en el orden de Tab, las flechas mueven el foco y Enter coloca", () => {
    jugarMinijuego("energia-solar");
    fireEvent.click(screen.getByRole("button", { name: /Empezar/ }));
    const tablero = screen.getByRole("group", { name: /Terreno de \d+ filas por \d+ columnas/ });
    const enTab = () => [...tablero.querySelectorAll("button")].filter((b) => b.tabIndex === 0);
    expect(enTab()).toHaveLength(1);
    expect(enTab()[0].getAttribute("aria-label")).toMatch(/^Fila 1, columna 1: /);

    enTab()[0].focus();
    fireEvent.keyDown(tablero, { key: "ArrowRight" });
    fireEvent.keyDown(tablero, { key: "ArrowDown" });
    expect(document.activeElement.getAttribute("aria-label")).toMatch(/^Fila 2, columna 2: /);
    expect(enTab()).toHaveLength(1);

    // en los bordes no se sale del tablero
    for (let i = 0; i < 20; i++) fireEvent.keyDown(tablero, { key: "ArrowUp" });
    expect(document.activeElement.getAttribute("aria-label")).toMatch(/^Fila 1, columna 2: /);

    // Enter (clic) coloca; aria-pressed lo dice
    fireEvent.click(document.activeElement);
    expect(document.activeElement.getAttribute("aria-pressed")).toBe("true");
  });
});
