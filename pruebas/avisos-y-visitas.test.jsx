/* Aviso de calificaciones bajas (administración) y contador de visitas (portada y administración). */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, within } from "@testing-library/react";
import ResumenOpiniones, { AvisoBajasHoy } from "../src/components/ResumenOpiniones.jsx";
import ResumenVisitas, { resumirVisitas } from "../src/components/ResumenVisitas.jsx";
import { ContadorVisitas } from "../src/components/Portada.jsx";
import { avisosBajas, hoyTijuana } from "../src/lib/opiniones.js";
import { registrarVisita, reiniciarVisitas } from "../src/lib/visitas.js";

beforeEach(() => { localStorage.clear(); reiniciarVisitas(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const HOY = hoyTijuana();
const fila = (o) => ({ dia: HOY, evento: null, quien: null, juego: 5, trato: 5, explicacion: 5, respuestas: 1, ...o });

describe("aviso de calificaciones bajas", () => {
  it("marca el día cuando hay 3 o más caritas rojas o naranjas y son al menos el 30 %", () => {
    const filas = [
      fila({ respuestas: 6 }),
      fila({ trato: 1, respuestas: 2 }),
      fila({ juego: 2, trato: 2, respuestas: 2 }),
      // otro evento el mismo día: va aparte
      fila({ evento: "feria", trato: 1, respuestas: 1 }),
      fila({ evento: "feria", respuestas: 9 }),
    ];
    const a = avisosBajas(filas, { hoy: HOY });
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ dia: HOY, evento: null, total: 10, bajas: 4, hoy: true, texto: "General (sin evento)" });
    expect(a[0].pregunta).toMatchObject({ id: "trato", bajas: 4 });
  });

  it("una carita roja entre muchas no alarma, ni tres entre cincuenta", () => {
    expect(avisosBajas([fila({ juego: 1, respuestas: 2 }), fila({})], { hoy: HOY })).toEqual([]);
    expect(avisosBajas([fila({ juego: 1, respuestas: 3 }), fila({ respuestas: 47 })], { hoy: HOY })).toEqual([]);
    // una carita amarilla (3) no es baja
    expect(avisosBajas([fila({ juego: 3, trato: 3, explicacion: 3, respuestas: 9 })], { hoy: HOY })).toEqual([]);
  });

  it("si es de hoy se ve en grande arriba de la administración", () => {
    render(<AvisoBajasHoy filas={[fila({ evento: "feria-de-ciencias", explicacion: 1, respuestas: 5 })]} />);
    const aviso = screen.getByRole("region", { name: /Hoy hay calificaciones bajas/ });
    expect(aviso.textContent).toMatch(/Feria de ciencias:.*5 de 5 opiniones con carita roja o naranja/);
    expect(aviso.textContent).toMatch(/Lo más bajo: «¿Cómo te explicaron\?»/);
    expect(within(aviso).getByRole("link", { name: /Ver la evaluación abierta/ }).getAttribute("href")).toBe("#opiniones");
  });

  it("los de días anteriores no salen arriba, pero sí en la evaluación abierta (y «Ver» filtra el evento)", () => {
    const filas = [
      fila({ dia: "2026-01-10", evento: "visita", juego: 1, respuestas: 4 }),
      fila({ dia: "2026-01-10", respuestas: 8 }),
    ];
    const { unmount } = render(<AvisoBajasHoy filas={filas} />);
    expect(document.body.textContent).toBe("");
    unmount();
    render(<ResumenOpiniones filas={filas} />);
    expect(screen.getByRole("heading", { name: /Calificaciones bajas/ })).toBeTruthy();
    expect(document.querySelector(".op-alerta--antes").textContent).toMatch(/10 de enero · Visita:.*4 de 4/);
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));
    expect(screen.getByRole("button", { name: /^Visita/, pressed: true })).toBeTruthy();
  });

  it("sin calificaciones bajas no aparece nada", () => {
    render(<ResumenOpiniones filas={[fila({ respuestas: 20 })]} />);
    expect(screen.queryByText(/Calificaciones bajas/)).toBeNull();
  });
});

describe("contador de visitas", () => {
  let llamadas;
  beforeEach(() => {
    llamadas = [];
    vi.stubGlobal("fetch", vi.fn(async (url, op) => {
      llamadas.push(op?.method || "GET");
      return { ok: true, status: 200, json: async () => ({ total: 1234, hoy: 5 }) };
    }));
  });

  it("la primera vez del día suma (POST); las demás solo leen (GET); al otro día vuelve a sumar", async () => {
    await registrarVisita({ hoy: "2026-11-27" });
    await registrarVisita({ hoy: "2026-11-27" });
    await registrarVisita({ hoy: "2026-11-28" });
    expect(llamadas).toEqual(["POST", "GET", "POST"]);
  });

  it("la portada muestra el total y las de hoy", async () => {
    render(<ContadorVisitas />);
    expect(document.querySelector(".contador-visitas")).toBeNull();   // todavía sin número
    await act(async () => { await registrarVisita(); });
    expect(document.querySelector(".contador-visitas").textContent).toMatch(/1,234 visitas · 5 hoy/);
  });

  it("está hasta arriba de la portada, en grande, y al volver sale al instante el último número", async () => {
    const { default: App } = await import("../src/App.jsx");
    await act(async () => { await registrarVisita(); });
    reiniciarVisitas();   // como al abrir otra vez la página: lee el número guardado
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    render(<App />);
    const contador = document.querySelector(".contador-visitas");
    expect(contador.querySelector(".contador-visitas__numero").textContent).toBe("1,234");
    // antes que el botón de opinión y que todo lo demás, después de la barra de arriba
    const portada = document.querySelector(".portada");
    const hijos = [...portada.children];
    expect(hijos.indexOf(contador)).toBe(1);
    expect(hijos[0].matches(".portada__barra")).toBe(true);
    expect(contador.textContent).not.toMatch(/hoy/);   // «hoy» espera al número nuevo
  });

  it("sin internet o sin base de datos no se muestra (y no truena)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    render(<ContadorVisitas />);
    await act(async () => { expect(await registrarVisita()).toBeNull(); });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    await act(async () => { expect(await registrarVisita()).toBeNull(); });
    expect(document.querySelector(".contador-visitas")).toBeNull();
    // si no se pudo contar, se vuelve a intentar sumar en la siguiente visita
    expect(localStorage.getItem("escuadron-visita")).toBeNull();
  });

  it("los navegadores automáticos no cuentan", async () => {
    Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => true });
    try {
      expect(await registrarVisita()).toBeNull();
      expect(llamadas).toEqual([]);
    } finally {
      delete navigator.webdriver;
    }
  });

  it("administración: hoy, 7 días, 30 días, total y una barra por día", () => {
    const dias = [
      { dia: "2026-10-01", visitas: 100 },   // fuera de los 30 días: solo cuenta en el total
      { dia: "2026-11-20", visitas: 4 },
      { dia: "2026-11-26", visitas: 10 },
      { dia: "2026-11-27", visitas: 6 },
    ];
    const r = resumirVisitas(dias, { hoy: "2026-11-27" });
    expect(r).toMatchObject({ hoy: 6, semana: 16, mes: 20, total: 120, desde: "2026-10-01" });
    expect(r.serie).toHaveLength(30);
    expect(r.serie.at(-1)).toEqual({ dia: "2026-11-27", visitas: 6 });
    expect(r.serie[0].dia).toBe("2026-10-29");

    render(<ResumenVisitas datos={{ total: 120, hoy: 6, dias }} />);
    expect(screen.getByRole("heading", { name: /Visitas al sitio/ }).textContent).toMatch(/desde el 1 de octubre de 2026/);
    expect(document.querySelectorAll(".vis-grafica__dia")).toHaveLength(30);
    expect(screen.getByText("Total").nextSibling.textContent).toBe("120");
  });
});
