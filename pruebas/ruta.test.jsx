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

/* Mapa fijo para probar el motor sin depender del azar. Ruta segura: 17 pasos. */
RUTAS.prueba = [
  {
    id: "prueba",
    titulo: "Mapa de prueba",
    pista: "",
    segundosPorPaso: 1,
    castigo: 4,
    mapa: [
      "###########",
      "#J..#..X..#",
      "#.#.#.###.#",
      "#.#.....#E#",
      "#.###.#.#.#",
      "#T..#.#...#",
      "##.##.###.#",
      "#....X..#.#",
      "#.####..#.#",
      "#....##.#P#",
      "####.....S#",
    ],
  },
];

function montar(dificultad, rutas) {
  const base = POR_ID["ruta-evacuacion"];
  const juego = rutas ? { ...base, rutas } : base;
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
  RUTAS["ruta-evacuacion"].forEach((nivel) => {
    it(`${nivel.id}: 300 laberintos, todos con salida y con peligros en el camino`, () => {
      const { columnas, filas, peligros, elevadores } = nivel.generar;
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
        expect((texto.match(/[XT]/g) || []).length, mapa.join("\n")).toBe(peligros + elevadores);
      }
    });
  });

  it("voltear un mapa conserva su ruta segura", () => {
    const original = RUTAS.prueba[0].mapa;
    [[true, false], [false, true], [true, true]].forEach(([h, v]) => {
      const mapa = voltear(original, h, v);
      expect(rutaSegura(mapa, buscar(mapa, "J")).length).toBe(rutaSegura(original, buscar(original, "J")).length);
    });
  });

  it("cada nivel es más duro que el anterior", () => {
    const [facil, medio, dificil] = RUTAS["ruta-evacuacion"];
    expect(facil.vision).toBeUndefined();
    expect(medio.vision).toBeGreaterThan(dificil.vision);
    expect(medio.replicas.cada).toBeLessThan(facil.replicas.cada);
    expect(dificil.replicas.cada).toBeLessThan(medio.replicas.cada);
    expect(dificil.castigo).toBeGreaterThan(medio.castigo);
    expect(medio.castigo).toBeGreaterThan(facil.castigo);
  });
});

describe("ruta de evacuación difícil de verdad", () => {
  it("los peligros tapan el paso: chocar quita una vida y segundos una sola vez", () => {
    vi.useFakeTimers();
    montar(null, "prueba");
    const inicio = indiceYo();
    expect(vidas()).toBe(4);
    // 17 pasos × 1 s × 1.4 (fácil) = 23.8 s
    const reloj = () => document.querySelector(".cronometro__numero").textContent;
    expect(reloj()).toBe("24");

    // del inicio (1,1) bajando tres casillas se llega junto al elevador (1,5)
    tecla("ArrowDown"); tecla("ArrowDown"); tecla("ArrowDown");
    const junto = indiceYo();
    expect(junto).not.toBe(inicio);

    tecla("ArrowDown");
    expect(indiceYo()).toBe(junto);
    expect(vidas()).toBe(3);
    expect(reloj()).toBe("20");
    expect(document.querySelector(".retro")).toBeTruthy();

    act(() => { fireEvent.click(screen.getByText(/Seguir/)); });
    tecla("ArrowDown");
    expect(indiceYo()).toBe(junto);
    expect(vidas()).toBe(3);
    expect(reloj()).toBe("20");
    expect(document.querySelector(".celda--golpe")).toBeTruthy();
  });

  it("si los choques se comen todo el reloj, se acaba la partida", () => {
    RUTAS.castigo = [{ ...RUTAS.prueba[0], castigo: 30 }];
    vi.useFakeTimers();
    montar(null, "castigo");
    tecla("ArrowDown"); tecla("ArrowDown"); tecla("ArrowDown"); tecla("ArrowDown");
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText(/Se acabó/)).toBeTruthy();
  });

  it("medio: se va la luz y la linterna alumbra poco", () => {
    montar("Medio");
    const total = document.querySelectorAll(".celda").length;
    expect(total).toBe(13 * 13);
    expect(document.querySelectorAll(".celda--oscura").length).toBeGreaterThan(total / 2);
    expect(document.querySelector(".cruceta__centro").textContent).toBe("🔦");
  });

  it("difícil: casi a ciegas, solo se ve lo de junto y la salida brilla", () => {
    montar("Difícil");
    const total = document.querySelectorAll(".celda").length;
    expect(total).toBe(13 * 15);
    // la linterna alumbra 3×3 alrededor del jugador; lo demás, oscuro (salvo la salida)
    const visibles = total - document.querySelectorAll(".celda--oscura").length;
    expect(visibles).toBeLessThanOrEqual(10);
    expect(document.querySelector(".mapa").textContent).toContain("🟢");
  });

  it("fácil: las réplicas tiran escombro sin cerrar el último camino", () => {
    vi.useFakeTimers();
    montar();
    expect(document.querySelectorAll(".celda").length).toBe(11 * 11);
    expect(document.querySelector(".celda__escombro")).toBeNull();

    act(() => { vi.advanceTimersByTime(10500); });
    // tembló; el escombro solo cae si hay dónde sin tapar la salida (casi siempre)
    expect(document.querySelector(".tablero-zona.tiembla")).toBeTruthy();
    expect(document.querySelector(".aviso-flotante").textContent).toMatch(/Réplica/);

    const { mapa, yo } = mapaEnPantalla();
    expect(rutaSegura(mapa, yo), mapa.join("\n")).toBeTruthy();
  });
});
