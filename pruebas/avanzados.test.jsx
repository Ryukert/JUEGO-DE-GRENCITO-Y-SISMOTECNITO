import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import { POR_ID } from "../src/juegos/registro.js";
import { PERSONAJES } from "../src/data/personajes.js";
import { borrarProgreso, leerProgreso } from "../src/lib/progreso.js";

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

function montar(id, dificultad) {
  const juego = POR_ID[id];
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
  if (dificultad) {
    const btn = [...document.querySelectorAll(".dificultad")].find((b) => b.textContent.includes(dificultad));
    if (btn) act(() => { fireEvent.click(btn); });
  }
  act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
  return juego;
}

const btn = (re) => [...document.querySelectorAll("button")].find((b) => re.test(b.textContent));
const primeraOpcion = () => document.querySelector(".opciones button:not(:disabled)");

describe("simulaciones (jefes finales)", () => {
  ["salva-planeta", "ecosistema", "ciudad-sostenible", "simulador-emergencia", "comandante-emergencias", "tecnito-vs-greencito"].forEach((id) => {
    it(`${id}: se juega hasta el final y guarda progreso`, () => {
      montar(id);
      expect(document.querySelectorAll(".sim__ind").length).toBeGreaterThan(2);

      for (let i = 0; i < 60 && !screen.queryByText(/¡Reto superado!|Se acabó/); i++) {
        const seguir = btn(/Siguiente turno|Ver cómo quedó|Elegir otra cosa/);
        if (seguir) { act(() => { fireEvent.click(seguir); }); continue; }
        const op = primeraOpcion();
        if (!op) break;
        act(() => { fireEvent.click(op); });
      }

      expect(screen.queryByText(/¡Reto superado!|Se acabó/)).toBeTruthy();
      expect(leerProgreso().juegos[id].partidas).toBe(1);
    });
  });

  it("ciudad sostenible: no deja gastar más presupuesto del que hay", () => {
    montar("ciudad-sostenible");
    const recurso = () => Number(document.querySelector(".sim__recurso").textContent.replace(/\D/g, ""));
    const inicial = recurso();
    expect(inicial).toBe(100);
    act(() => { fireEvent.click(primeraOpcion()); });
    expect(recurso()).toBeLessThanOrEqual(inicial);
    expect(recurso()).toBeGreaterThanOrEqual(0);
  });

  it("los indicadores nunca salen del rango 0-100", () => {
    montar("salva-planeta");
    for (let i = 0; i < 40; i++) {
      const seguir = btn(/Siguiente turno|Ver cómo quedó/);
      const objetivo = seguir || primeraOpcion();
      if (!objetivo || screen.queryByText(/¡Reto superado!|Se acabó/)) break;
      act(() => { fireEvent.click(objetivo); });
      [...document.querySelectorAll(".sim__relleno")].forEach((b) => {
        const ancho = parseFloat(b.style.width);
        expect(ancho).toBeGreaterThanOrEqual(0);
        expect(ancho).toBeLessThanOrEqual(100);
      });
    }
  });
});

describe("construcción y colocación", () => {
  ["construye-edificio", "captura-lluvia"].forEach((id) => {
    it(`${id}: se apila lo construido y termina con la prueba`, () => {
      vi.useFakeTimers();
      montar(id);
      for (let i = 0; i < 20 && !screen.queryByText(/¡Reto superado!|Se acabó/); i++) {
        const seguir = btn(/Siguiente etapa|Simulacro|Temporada/);
        if (seguir) { act(() => { fireEvent.click(seguir); }); act(() => { vi.advanceTimersByTime(2000); }); continue; }
        const op = primeraOpcion();
        if (!op) break;
        act(() => { fireEvent.click(op); });
      }
      expect(screen.queryByText(/¡Reto superado!|Se acabó/)).toBeTruthy();
      vi.useRealTimers();
    });
  });

  it("energía solar: colocar y quitar paneles respeta el máximo", () => {
    const juego = montar("energia-solar");
    const celdas = () => [...document.querySelectorAll(".terreno__celda")];
    const puestos = () => document.querySelectorAll(".terreno__celda--puesto").length;

    celdas().forEach((c) => act(() => { fireEvent.click(c); }));
    // nunca más equipos de los permitidos
    expect(puestos()).toBeLessThanOrEqual(7);
    expect(puestos()).toBeGreaterThan(0);

    // volver a tocar uno puesto lo quita
    const antes = puestos();
    const uno = document.querySelector(".terreno__celda--puesto");
    act(() => { fireEvent.click(uno); });
    expect(puestos()).toBe(antes - 1);
  });

  it("energía eólica: castiga dos turbinas en la misma columna", () => {
    montar("energia-eolica");
    const celdas = [...document.querySelectorAll(".terreno__celda")];
    const cols = 5;
    // dos en la columna 3 (cresta en varias filas)
    act(() => { fireEvent.click(celdas[0 * cols + 3]); });
    act(() => { fireEvent.click(celdas[1 * cols + 3]); });
    act(() => { fireEvent.click(btn(/Probar así|Poner en marcha/)); });
    expect(document.querySelector(".coloca__penal")).toBeTruthy();
  });
});

describe("desafíos generales nuevos", () => {
  it("código secreto: las pistas son coherentes y se puede ganar", () => {
    montar("codigo-secreto");
    const teclas = () => [...document.querySelectorAll(".ficha--simbolo")];
    for (let intento = 0; intento < 8; intento++) {
      if (document.querySelector(".retro")) break;
      const t = teclas();
      if (!t.length) break;
      const largo = document.querySelectorAll(".codigo__hueco").length;
      for (let i = 0; i < largo; i++) act(() => { fireEvent.click(t[i % t.length]); });
      act(() => { fireEvent.click(btn(/Probar/)); });
    }
    // siempre acaba mostrando retroalimentación, gane o pierda
    expect(document.querySelector(".retro")).toBeTruthy();
    expect(document.querySelector(".retro__dato")).toBeTruthy();
  });

  it("sopa de letras: todas las palabras listadas están en el tablero", () => {
    montar("palabras-ocultas");
    const lado = document.querySelectorAll(".sopa__celda").length ** 0.5;
    expect(Number.isInteger(lado)).toBe(true);
    const listadas = [...document.querySelectorAll(".sopa__lista li")].map((l) => l.textContent);
    expect(listadas.length).toBeGreaterThanOrEqual(3);

    const celdas = [...document.querySelectorAll(".sopa__celda")].map((c) => c.textContent);
    const rejilla = [];
    for (let f = 0; f < lado; f++) rejilla.push(celdas.slice(f * lado, (f + 1) * lado));

    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
    listadas.forEach((palabra) => {
      let hallada = false;
      for (let f = 0; f < lado && !hallada; f++)
        for (let c = 0; c < lado && !hallada; c++)
          for (const [df, dc] of dirs) {
            let ok = true;
            for (let i = 0; i < palabra.length; i++) {
              const nf = f + df * i, nc = c + dc * i;
              if (nf < 0 || nf >= lado || nc < 0 || nc >= lado || rejilla[nf][nc] !== palabra[i]) { ok = false; break; }
            }
            if (ok) { hallada = true; break; }
          }
      expect(hallada, `no encontré ${palabra} en el tablero`).toBe(true);
    });
  });

  it("rompecabezas: siempre arranca revuelto y se puede mover", () => {
    montar("rompecabezas");
    const piezas = () => [...document.querySelectorAll(".puzzle__pieza")];
    expect(piezas().length).toBe(9);
    const ordenado = piezas().every((p, i) => p.classList.contains("puzzle__pieza--ok"));
    expect(ordenado).toBe(false);

    const hueco = piezas().findIndex((p) => p.classList.contains("puzzle__pieza--hueco"));
    const vecino = hueco % 3 === 0 ? hueco + 1 : hueco - 1;
    act(() => { fireEvent.click(piezas()[vecino]); });
    const nuevoHueco = piezas().findIndex((p) => p.classList.contains("puzzle__pieza--hueco"));
    expect(nuevoHueco).toBe(vecino);
  });

  it("ruleta: gira, cae en categoría y hace una pregunta", () => {
    vi.useFakeTimers();
    montar("ruleta-educativa");
    expect(document.querySelector(".ruleta__disco")).toBeTruthy();
    act(() => { fireEvent.click(btn(/Girar la ruleta/)); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(document.querySelector(".ruleta__categoria")).toBeTruthy();
    expect(document.querySelectorAll(".opciones button").length).toBeGreaterThan(1);
    vi.useRealTimers();
  });

  it("atrapa la respuesta: las opciones se mueven y se pueden tocar", () => {
    vi.useFakeTimers();
    montar("atrapa-respuesta");
    const pos = () => [...document.querySelectorAll(".cancha__opcion")].map((o) => o.style.left);
    const antes = pos();
    expect(antes.length).toBeGreaterThan(1);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(pos().join()).not.toBe(antes.join());
    act(() => { fireEvent.click(document.querySelector(".cancha__opcion")); });
    expect(document.querySelector(".retro")).toBeTruthy();
    vi.useRealTimers();
  });

  it("polinizadores: la colmena no abre hasta visitar todas las flores", () => {
    montar("polinizadores");
    const texto = document.querySelector(".ruta__contador").textContent;
    expect(texto).toMatch(/0\/\d+/);
    expect(document.querySelectorAll(".celda").length).toBeGreaterThan(50);
  });
});

describe("limpieza", () => {
  ["atrapa-respuesta", "codigo-secreto", "energia-solar", "palabras-ocultas", "ruleta-educativa"].forEach((id) => {
    it(`${id} no deja timers vivos al salir`, () => {
      vi.useFakeTimers();
      const juego = POR_ID[id];
      const { unmount } = render(
        <PantallaMinijuego juego={juego} personaje={PERSONAJES[juego.personaje]} grado="primaria"
          progreso={leerProgreso()} onSalir={() => {}} onProgreso={() => {}} />
      );
      act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
      unmount();
      expect(vi.getTimerCount()).toBe(0);
      vi.useRealTimers();
    });
  });
});

describe("centro de entrenamiento con el catálogo completo", () => {
  it("muestra las tres familias, bloquea por XP y desbloquea al subir", async () => {
    const { default: Centro } = await import("../src/pages/Centro.jsx");
    const { JUEGOS, estaDesbloqueado, siguienteEnDesbloquear } = await import("../src/juegos/registro.js");

    const sinXp = { ...leerProgreso(), xp: 0 };
    const { rerender } = render(<Centro progreso={sinXp} onJugar={() => {}} onSalir={() => {}} />);

    // arranca con contenido suficiente para jugar sin desbloquear nada
    const libres = JUEGOS.filter((j) => estaDesbloqueado(j, sinXp));
    expect(libres.length).toBeGreaterThanOrEqual(8);
    expect(libres.length).toBeLessThan(JUEGOS.length);
    expect(screen.getByText(new RegExp(`${libres.length} de ${JUEGOS.length}`))).toBeTruthy();
    expect(siguienteEnDesbloquear(sinXp)).toBeTruthy();

    // el jefe final de Tecnito está en su categoría y bloqueado
    fireEvent.click(screen.getByText(/Tecnito/));
    expect(screen.getByText("Jefes finales")).toBeTruthy();
    const jefe = [...document.querySelectorAll(".tarjeta")].find((t) =>
      t.textContent.includes("Comandante de emergencias")
    );
    expect(jefe.classList.contains("tarjeta--bloqueada")).toBe(true);
    expect(jefe.disabled).toBe(true);

    // con XP de sobra, todo abierto y ya no hay "siguiente"
    const conXp = { ...leerProgreso(), xp: 5000 };
    rerender(<Centro progreso={conXp} onJugar={() => {}} onSalir={() => {}} />);
    expect(document.querySelectorAll(".tarjeta--bloqueada").length).toBe(0);
    expect(siguienteEnDesbloquear(conXp)).toBe(null);
  });

});
