/* Evaluación abierta (/opinion): la ve cualquiera desde la portada y se contesta sin cuenta. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, within } from "@testing-library/react";
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

  it("con ?evento= dice de qué evento es y lo manda con cada opinión (también después de limpiarse)", async () => {
    window.history.pushState({}, "", "/opinion?evento=Feria de Ciencias");
    try {
      render(<Opinion />, enMain());
      expect(screen.getByText("Feria de ciencias")).toBeTruthy();
      contestarTodo(5);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mi opinión" })));
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Otra opinión" })));
      contestarTodo(3);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mi opinión" })));
      expect(enviadas.map((o) => o.evento)).toEqual(["feria-de-ciencias", "feria-de-ciencias"]);
    } finally {
      window.history.pushState({}, "", "/");
    }
  });

  it("sin evento en la dirección no manda evento (la general)", async () => {
    render(<Opinion />, enMain());
    expect(document.querySelector(".opinion__evento")).toBeNull();
    contestarTodo(4);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mi opinión" })));
    expect(enviadas[0]).not.toHaveProperty("evento");
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

describe("difusión: QR, cartel y reportes", () => {
  it("el QR tiene las tres esquinas de ubicación y cambia con la dirección", async () => {
    const { matrizQr, trazoQr } = await import("../src/lib/qr.js");
    const m = matrizQr("https://juego.ejemplo.mx/opinion");
    const n = m.length;
    expect(n).toBeGreaterThanOrEqual(21);
    expect(m.every((f) => f.length === n)).toBe(true);
    // cuadro de ubicación de 7×7: borde negro, anillo blanco, centro negro de 3×3
    for (const [f0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      for (let i = 0; i < 7; i++) {
        expect(m[f0][c0 + i] && m[f0 + 6][c0 + i] && m[f0 + i][c0] && m[f0 + i][c0 + 6]).toBe(true);
      }
      expect(m[f0 + 1][c0 + 1]).toBe(false);
      expect(m[f0 + 3][c0 + 3]).toBe(true);
    }
    expect(JSON.stringify(matrizQr("https://otro.mx/opinion"))).not.toBe(JSON.stringify(m));
    expect(trazoQr(m)).toMatch(/^M\d+ \d+h1v1h-1z/);
  });

  it("cartel: una hoja carta con la dirección y el QR dibujado", async () => {
    const { crearCartel } = await import("../src/lib/pdfOpiniones.js");
    const doc = await crearCartel("https://juego.ejemplo.mx/opinion", { imagenes: false });
    expect(doc.getNumberOfPages()).toBe(1);
    const texto = new TextDecoder("latin1").decode(new Uint8Array(doc.output("arraybuffer")));
    expect(texto.startsWith("%PDF-")).toBe(true);
    expect(texto).toContain("juego.ejemplo.mx/opinion");
    expect(texto).toContain("no necesitas registrarte");
    const conEvento = await crearCartel("https://juego.ejemplo.mx/opinion?evento=feria", { imagenes: false, evento: "Feria" });
    const t2 = new TextDecoder("latin1").decode(new Uint8Array(conEvento.output("arraybuffer")));
    expect(t2).toContain("(Feria)");
    expect(t2).toContain("juego.ejemplo.mx/opinion?evento=feria");
  });

  it("reporte en PDF y CSV para Excel con promedios, caritas, quién y días", async () => {
    const { crearReporte, csvOpiniones } = await import("../src/lib/pdfOpiniones.js");
    const { resumirOpiniones } = await import("../src/lib/opiniones.js");
    const filas = Array.from({ length: 12 }, (_, d) => ({
      dia: `2026-11-${String(d + 1).padStart(2, "0")}`, quien: d % 2 ? "alumno" : null,
      juego: 1 + (d % 5), trato: 5, explicacion: 4, respuestas: d + 1,
    }));
    const r = resumirOpiniones(filas);
    const doc = await crearReporte(r, { periodo: "todo", quien: "todos" });
    expect(new TextDecoder().decode(new Uint8Array(doc.output("arraybuffer")).slice(0, 5))).toBe("%PDF-");
    const csv = csvOpiniones(r, { periodo: "todo", quien: "todos" });
    expect(csv.charCodeAt(0)).toBe(0xfeff);   // BOM: Excel abre bien los acentos
    expect(csv).toContain("Pregunta,Promedio (1 a 5),Muy mal,Mal,Regular,Bien,Excelente,Total");
    expect(csv).toContain(`¿Cómo te atendieron?,5.00,0,0,0,0,${r.total},${r.total}`);
    expect(csv).toContain("2026-11-12,12");
    // sin opiniones, el reporte sale igual (con el aviso)
    expect((await crearReporte(resumirOpiniones([]), { periodo: "todo", quien: "todos" })).getNumberOfPages()).toBe(1);
  });
});

describe("pantalla completa (tableta)", () => {
  it("aparece donde el navegador lo permite y al activarla esconde «Ir al juego»", async () => {
    let completa = null;
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => completa });
    document.documentElement.requestFullscreen = vi.fn(async () => { completa = document.documentElement; document.dispatchEvent(new Event("fullscreenchange")); });
    document.exitFullscreen = vi.fn(async () => { completa = null; document.dispatchEvent(new Event("fullscreenchange")); });
    render(<Opinion />, enMain());
    expect(screen.getByRole("link", { name: "Ir al juego" })).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Pantalla completa" })));
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Ir al juego" })).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Salir de pantalla completa" })));
    expect(screen.getByRole("link", { name: "Ir al juego" })).toBeTruthy();
    delete document.fullscreenEnabled;
    delete document.fullscreenElement;
  });

  it("donde no se puede (iPhone), el botón no aparece", () => {
    render(<Opinion />, enMain());
    expect(screen.queryByRole("button", { name: "Pantalla completa" })).toBeNull();
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
    // sin eventos no estorba un filtro de eventos
    expect(screen.queryByRole("group", { name: "Evento" })).toBeNull();
  });

  it("por evento: filtra sus opiniones y arma el enlace de un evento nuevo", () => {
    render(
      <ResumenOpiniones filas={[
        { dia: "2026-11-26", evento: null, quien: null, juego: 5, trato: 5, explicacion: 5, respuestas: 2 },
        { dia: "2026-11-26", evento: "feria-de-ciencias", quien: "alumno", juego: 2, trato: 2, explicacion: 2, respuestas: 2 },
      ]} />,
      enMain(),
    );
    expect(screen.getAllByText("3.5 de 5 · Bien")).toHaveLength(3);   // todos: (5·2 + 2·2) / 4
    const eventos = screen.getByRole("group", { name: "Evento" });
    fireEvent.click(within(eventos).getByRole("button", { name: /Feria de ciencias/ }));
    expect(screen.getAllByText("2.0 de 5 · Mal")).toHaveLength(3);
    // al elegirlo, el enlace y el QR son los de ese evento
    expect(screen.getByRole("textbox", { name: /Evento/ }).value).toBe("Feria de ciencias");
    expect(document.querySelector(".op-enlace").getAttribute("href")).toBe("/opinion?evento=feria-de-ciencias");
    fireEvent.click(within(eventos).getByRole("button", { name: /General/ }));
    expect(screen.getAllByText("5.0 de 5 · Excelente")).toHaveLength(3);
    expect(document.querySelector(".op-enlace").getAttribute("href")).toBe("/opinion");

    fireEvent.change(screen.getByRole("textbox", { name: /Evento/ }), { target: { value: "Visita Secundaria Nº 3" } });
    expect(document.querySelector(".op-enlace").getAttribute("href")).toBe("/opinion?evento=visita-secundaria-n-3");
    expect(screen.getByText(/quedan en «Visita secundaria n 3»/)).toBeTruthy();
  });
});
