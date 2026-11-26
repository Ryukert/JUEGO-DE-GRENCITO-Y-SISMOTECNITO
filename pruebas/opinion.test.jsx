/* Evaluación abierta (/opinion): la ve cualquiera desde la portada y se contesta sin cuenta. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import axe from "axe-core";
import Opinion, { SEGUNDOS_GRACIAS } from "../src/pages/Opinion.jsx";
import ResumenOpiniones from "../src/components/ResumenOpiniones.jsx";
import App from "../src/App.jsx";
import { PREGUNTAS_OPINION } from "../src/data/opinion.js";
import { reiniciarPreferencias } from "../src/lib/preferencias.js";

let enviadas;
let enLinea;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  reiniciarPreferencias();
  enviadas = [];
  enLinea = true;
  window.AudioContext = undefined;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} });
  vi.stubGlobal("fetch", vi.fn(async (url, op) => {
    if (url === "/api/opinion" && op?.method === "POST") {
      if (!enLinea) throw new TypeError("Failed to fetch");
      enviadas.push(JSON.parse(op.body));
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
    return { ok: true, status: 200, json: async () => ({ disponible: false }) };
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const enMain = () => ({ container: document.body.appendChild(document.createElement("main")) });
const tocar = (pregunta, etiqueta) =>
  fireEvent.click(screen.getByRole("group", { name: new RegExp(pregunta.replace(/[¿?]/g, "")) }).querySelector(`input[value="${etiqueta}"]`));
const contestarTodo = (valor = 5) => PREGUNTAS_OPINION.forEach((p) => tocar(p.texto, valor));

describe("portada", () => {
  it("el botón «¿Qué te pareció?» está a la vista y lleva a /opinion", () => {
    render(<App />, enMain());
    const boton = screen.getByRole("link", { name: /Qué te pareció\? ¡Califícanos!/ });
    expect(boton.getAttribute("href")).toBe("/opinion");
    expect(boton.textContent).toMatch(/sin registrarte/);
  });
});

describe("pantalla de opinión", () => {
  it("no pide correo, código ni PIN, y no tiene problemas de accesibilidad", async () => {
    render(<Opinion />, enMain());
    expect(screen.getByRole("heading", { name: "¿Qué te pareció?" })).toBeTruthy();
    expect(document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]')).toHaveLength(0);
    for (const p of PREGUNTAS_OPINION) expect(screen.getByRole("group", { name: new RegExp(p.texto.replace(/[¿?]/g, "")) })).toBeTruthy();
    const { violations } = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
  });

  it("si falta una pregunta lo dice y no manda nada", async () => {
    render(<Opinion />, enMain());
    tocar(PREGUNTAS_OPINION[0].texto, 5);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mi opinión" })));
    expect(screen.getByRole("alert").textContent).toMatch(/Faltan 2 preguntas/);
    expect(enviadas).toEqual([]);
  });

  it("manda las caritas, da las gracias y queda lista para la siguiente persona", async () => {
    vi.useFakeTimers();
    render(<Opinion />, enMain());
    tocar("¿Qué te pareció el juego?", 5);
    tocar("¿Cómo te atendieron?", 4);
    tocar("¿Cómo te explicaron?", 3);
    fireEvent.click(screen.getByRole("radio", { name: "Mamá, papá o familiar" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mi opinión" })));
    expect(enviadas).toEqual([{ juego: 5, trato: 4, explicacion: 3, quien: "familia" }]);
    expect(screen.getByRole("heading", { name: "¡Gracias por tu opinión!" })).toBeTruthy();

    // un segundo a la vez: cada paso de la cuenta regresiva programa el siguiente
    for (let s = 0; s <= SEGUNDOS_GRACIAS; s++) await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole("heading", { name: "¿Qué te pareció?" })).toBeTruthy();
    expect(document.querySelectorAll("input:checked")).toHaveLength(0);   // limpia para la siguiente
  });

  it("sin internet la opinión espera y se manda con la siguiente", async () => {
    render(<Opinion />, enMain());
    enLinea = false;
    contestarTodo(2);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mi opinión" })));
    expect(screen.getByRole("heading", { name: "¡Gracias por tu opinión!" })).toBeTruthy();
    expect(enviadas).toEqual([]);
    enLinea = true;
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Otra opinión" })));
    contestarTodo(4);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mi opinión" })));
    expect(enviadas.map((o) => o.juego)).toEqual([2, 4]);
  });
});

describe("administración", () => {
  it("muestra la carita promedio de cada pregunta y filtra por quién contestó", () => {
    render(
      <ResumenOpiniones filas={[
        { dia: "2026-11-26", quien: null, juego: 5, trato: 5, explicacion: 4, respuestas: 3 },
        { dia: "2026-11-26", quien: "maestro", juego: 1, trato: 2, explicacion: 2, respuestas: 1 },
      ]} />,
      enMain(),
    );
    expect(screen.getByText(/4 opiniones en el periodo/)).toBeTruthy();
    expect(screen.getByText("4.0 de 5 · Bien")).toBeTruthy();   // el juego: (5·3 + 1) / 4
    fireEvent.click(screen.getByRole("button", { name: /Maestro o maestra/ }));
    expect(screen.getByText("1.0 de 5 · Muy mal")).toBeTruthy();
  });
});
