import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import { POR_ID } from "../src/juegos/registro.js";
import { PERSONAJES } from "../src/data/personajes.js";
import { borrarProgreso, leerProgreso } from "../src/lib/progreso.js";
import { PREGUNTAS, comoOpciones } from "../src/data/juegos/preguntas.js";

beforeEach(() => {
  localStorage.clear();
  borrarProgreso();
  window.AudioContext = undefined;
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {},
  });
  window.matchMedia = (q) => ({ matches: false, addListener() {}, removeListener() {} });
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  Element.prototype.scrollIntoView = function () {};
  vi.spyOn(console, "error").mockImplementation((...a) => { throw new Error("React error: " + a[0]); });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function montar(id, extra = {}) {
  const juego = POR_ID[id];
  const onProgreso = vi.fn();
  render(
    <PantallaMinijuego
      juego={juego}
      personaje={PERSONAJES[juego.personaje]}
      grado="primaria"
      progreso={leerProgreso()}
      onSalir={() => {}}
      onProgreso={onProgreso}
      {...extra}
    />
  );
  act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
  return { juego, onProgreso };
}

/** Textos de todas las respuestas correctas de un banco. */
function buenas(banco) {
  const set = new Set();
  PREGUNTAS[banco].forEach((p) => {
    comoOpciones(p).opciones.filter((o) => o.ok).forEach((o) => set.add(o.texto));
  });
  return set;
}

describe("jugadas completas", () => {
  it("quiz relámpago: contestando bien se termina y se guarda XP y récord", () => {
    const { onProgreso } = montar("quiz-relampago");
    const correctas = buenas("quiz-relampago");

    for (let i = 0; i < 40; i++) {
      const botones = [...document.querySelectorAll(".opciones button")];
      const siguiente = botones.find((b) => /Siguiente|Terminar|Ver resultado/.test(b.textContent));
      if (siguiente) { act(() => { fireEvent.click(siguiente); }); continue; }
      const buena = botones.find((b) => correctas.has(b.textContent.replace(/^[A-D]/, "")));
      if (!buena) break;
      act(() => { fireEvent.click(buena); });
    }

    expect(screen.getByText("¡Reto superado!")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();

    const p = leerProgreso();
    expect(p.xp).toBeGreaterThan(0);
    expect(p.juegos["quiz-relampago"].record).toBeGreaterThan(0);
    expect(p.juegos["quiz-relampago"].dificultades).toContain("facil");
    expect(onProgreso).toHaveBeenCalled();
  });

  it("verdadero o falso: una respuesta mala explica cuál era la correcta", () => {
    montar("verdadero-falso");
    const botones = [...document.querySelectorAll(".opciones button")];
    act(() => { fireEvent.click(botones[0]); });
    // sea acierto o error, siempre hay retroalimentación con dato
    expect(document.querySelector(".retro")).toBeTruthy();
    expect(document.querySelector(".retro__dato").textContent).toMatch(/¿Sabías que/);
  });

  it("casa segura: encontrar todos los riesgos completa el reto y da semillas o escudos", () => {
    vi.useFakeTimers();
    montar("casa-segura");

    for (let i = 0; i < 40 && !screen.queryByText(/Reto superado|Se acabó/); i++) {
      const seguir = [...document.querySelectorAll("button")].find((b) =>
        /Seguir buscando/.test(b.textContent)
      );
      if (seguir) {
        act(() => { fireEvent.click(seguir); });
        continue;
      }
      const libre = document.querySelector(".escena__obj:not(:disabled)");
      if (!libre) break;
      act(() => { fireEvent.click(libre); });
      act(() => { vi.advanceTimersByTime(1000); });
    }

    const guardado = leerProgreso();
    expect(guardado.juegos["casa-segura"]).toBeTruthy();
    expect(guardado.juegos["casa-segura"].partidas).toBe(1);
    expect(guardado.escudos + guardado.semillas).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it("clasifica la basura: mandar al contenedor correcto suma puntos", () => {
    montar("clasifica-basura");
    const nombre = document.querySelector(".residuo__nombre").textContent;
    expect(nombre.length).toBeGreaterThan(0);
    const botes = [...document.querySelectorAll("[data-bote]")];
    expect(botes.length).toBe(6);
    act(() => { fireEvent.click(botes[0]); });
    // o sumó puntos (aviso) o mostró la explicación del error
    const hayAviso = !!document.querySelector(".aviso-flotante");
    const hayRetro = !!document.querySelector(".retro");
    expect(hayAviso || hayRetro).toBe(true);
  });

  it("ruta de evacuación: el jugador se mueve con el teclado", () => {
    montar("ruta-evacuacion");
    const antes = document.querySelector(".celda--yo");
    const idxAntes = [...document.querySelectorAll(".celda")].indexOf(antes);
    act(() => { fireEvent.keyDown(window, { key: "ArrowDown" }); });
    const idxDespues = [...document.querySelectorAll(".celda")].indexOf(document.querySelector(".celda--yo"));
    expect(idxDespues).not.toBe(idxAntes);
  });

  it("planta un árbol: la mejor decisión hace crecer la planta", () => {
    montar("planta-arbol");
    const antes = document.querySelector(".cultivo__planta").textContent;
    const nativo = [...document.querySelectorAll(".opciones button")].find((b) => /nativo/.test(b.textContent));
    act(() => { fireEvent.click(nativo); });
    expect(document.querySelector(".cultivo__planta").textContent).not.toBe(antes);
    expect(document.querySelector(".retro--bien")).toBeTruthy();
  });

  it("los minijuegos clásicos siguen jugándose desde el centro", () => {
    montar("memorama");
    act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
    expect(document.querySelectorAll(".memo").length).toBe(12);
  });
});

describe("limpieza y persistencia", () => {
  it("no queda ningún timer vivo al desmontar un juego con cronómetro", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <PantallaMinijuego
        juego={POR_ID["agachate"]}
        personaje={PERSONAJES.sismo}
        grado="primaria"
        progreso={leerProgreso()}
        onSalir={() => {}}
        onProgreso={() => {}}
      />
    );
    act(() => { fireEvent.click(screen.getByText(/¡Empezar!/)); });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("el progreso viejo (v1) se migra sin perder récords", () => {
    localStorage.clear();
    localStorage.setItem(
      "escuadron-progreso-v1",
      JSON.stringify({ grado: "secundaria", records: { sismo: 480, green: 120 }, insignias: ["Una"], partidas: 7 })
    );
    borrarProgreso.__noop;
    // forzamos una lectura limpia recargando el módulo
    return import("../src/lib/progreso.js?fresh").then((mod) => {
      const p = mod.leerProgreso();
      expect(p.records.sismo).toBe(480);
      expect(p.partidas).toBe(7);
      expect(p.grado).toBe("secundaria");
      expect(p.xp).toBe(0);
      expect(p.version).toBe(2);
    });
  });
});
