/* Administración de encuestas en vivo: las gráficas se actualizan solas y marcan lo nuevo. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { totales, novedades, haceCuanto, useEnVivo, CADA } from "../src/lib/enVivo.js";
import Editores from "../src/pages/Editores.jsx";

const fila = (juego, respuestas, extra = {}) => ({ juego, tipo: "minijuego", grado: "primaria", dia: "2026-11-15", gusto: 5, dificultad: 2, respuestas, ...extra });

describe("cuentas del modo en vivo", () => {
  it("suma por juego y detecta qué llegó de nuevo", () => {
    const antes = [fila("memorama", 3), fila("memorama", 1, { gusto: 2 }), fila("clasifica-basura", 2)];
    const despues = [fila("memorama", 5), fila("memorama", 1, { gusto: 2 }), fila("clasifica-basura", 2), fila("energia-solar", 1)];
    expect(totales(antes)).toEqual({ total: 6, porJuego: { memorama: 4, "clasifica-basura": 2 } });
    expect(novedades(antes, despues)).toEqual({ nuevas: 3, juegos: ["memorama", "energia-solar"] });
    expect(novedades(null, despues)).toEqual({ nuevas: 0, juegos: [] });     // la primera lectura no es «nueva»
    expect(novedades(despues, antes).nuevas).toBe(0);                         // si baja (otro periodo), no cuenta
  });

  it("dice hace cuánto se actualizó", () => {
    const t = 1_000_000;
    expect(haceCuanto(t, t + 2_000)).toBe("justo ahora");
    expect(haceCuanto(t, t + 12_000)).toBe("hace 12 s");
    expect(haceCuanto(t, t + 180_000)).toBe("hace 3 min");
    expect(haceCuanto(null)).toBe("");
  });

  it("actualiza cada 30 s solo con la pestaña a la vista, y al volver a ella en seguida", () => {
    vi.useFakeTimers();
    const doc = Object.assign(new EventTarget(), { hidden: false });
    const actualizar = vi.fn();
    function Prueba({ activo }) {
      useEnVivo(actualizar, { activo, documento: doc });
      return null;
    }
    const { rerender, unmount } = render(<Prueba activo />);
    vi.advanceTimersByTime(CADA);
    expect(actualizar).toHaveBeenCalledTimes(1);
    doc.hidden = true;                       // pestaña oculta: no gasta consultas
    vi.advanceTimersByTime(CADA * 3);
    expect(actualizar).toHaveBeenCalledTimes(1);
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(actualizar).toHaveBeenCalledTimes(2);
    rerender(<Prueba activo={false} />);     // en pausa
    vi.advanceTimersByTime(CADA * 3);
    expect(actualizar).toHaveBeenCalledTimes(2);
    unmount();
    vi.useRealTimers();
  });
});

describe("la ventana de administración en vivo", () => {
  let respuesta;
  beforeEach(() => {
    sessionStorage.setItem("escuadron-editor", "pase-de-prueba");
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    respuesta = [fila("memorama", 3)];
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ filas: respuesta }) })));
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("llegan respuestas: se actualiza sola, marca «+N» y lo anuncia", async () => {
    render(<Editores />);
    await screen.findByText("Resultados de las encuestas");
    expect(screen.getByText(/En vivo/)).toBeTruthy();
    expect(document.querySelector(".ed-cifras dd").textContent).toBe("3");

    respuesta = [fila("memorama", 3), fila("memorama", 2, { gusto: 4 })];
    await act(async () => { await vi.advanceTimersByTimeAsync(CADA); });
    expect(document.querySelector(".ed-cifras dd").textContent).toBe("5 +2");
    expect(screen.getByText("2 respuestas nuevas")).toBeTruthy();
    expect(document.querySelectorAll(".ed-apiladas li.ed-nuevo").length).toBeGreaterThan(0);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("en pausa ya no consulta", async () => {
    render(<Editores />);
    await screen.findByText("Resultados de las encuestas");
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(screen.getByText(/En pausa/)).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(CADA * 3); });
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reanudar" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(CADA); });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("se abre también en /admin y /administradores", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.jsx"), "utf8");
    const patron = new RegExp(main.match(/const esEditores = \/(.+)\/\.test/)[1]);
    for (const ruta of ["/admin", "/admin/", "/administradores", "/editores"]) expect(patron.test(ruta), ruta).toBe(true);
    for (const ruta of ["/", "/administrador", "/admin/otra"]) expect(patron.test(ruta), ruta).toBe(false);
    const robots = readFileSync(resolve(process.cwd(), "public/robots.txt"), "utf8");
    expect(robots).toMatch(/^Disallow: \/admin$/m);
  });
});

describe("botón de la portada para entrar a la administración", () => {
  it("está en la portada, con o sin grado elegido, y lleva a /admin", async () => {
    const { default: App } = await import("../src/App.jsx");
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    window.scrollTo = () => {};
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ disponible: false }) })));
    localStorage.clear();
    render(<App />);
    const enlace = screen.getByRole("link", { name: /Administración/ });
    expect(enlace.getAttribute("href")).toBe("/admin");
    fireEvent.click(screen.getByRole("button", { name: /Primaria/ }));
    expect(screen.getByRole("link", { name: /Administración/ }).getAttribute("href")).toBe("/admin");
    vi.unstubAllGlobals();
  });
});
