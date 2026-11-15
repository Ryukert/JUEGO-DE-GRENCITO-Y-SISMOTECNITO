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

describe("entrar a la administración con correo y contraseña", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });

  it("pide correo y contraseña, los manda y muestra con qué correo entraste", async () => {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    sessionStorage.clear();
    const fetchFalso = vi.fn(async (url, op = {}) =>
      op.method === "POST"
        ? { ok: true, status: 200, json: async () => ({ pase: "p", correo: "directora@uabc.edu.mx" }) }
        : { ok: true, status: 200, json: async () => ({ filas: [] }) });
    vi.stubGlobal("fetch", fetchFalso);
    render(<Editores />);
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: "directora@uabc.edu.mx" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreta-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await screen.findByText("Resultados de las encuestas");
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body)).toEqual({ correo: "directora@uabc.edu.mx", contrasena: "secreta-123" });
    expect(screen.getByText("directora@uabc.edu.mx")).toBeTruthy();
  });

  it("se puede cambiar a la clave de administración como respaldo", () => {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    sessionStorage.clear();
    render(<Editores />);
    fireEvent.click(screen.getByRole("button", { name: "Entrar con la clave de administración" }));
    expect(screen.getByLabelText("Clave")).toBeTruthy();
    expect(screen.queryByLabelText(/Correo institucional/)).toBeNull();
  });
});

describe("la pantalla pide el correo institucional", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });
  it("al crear cuenta avisa sin mandar nada si el correo no es institucional (al entrar decide el servidor)", () => {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    sessionStorage.clear();
    const fetchFalso = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ filas: [] }) }));
    vi.stubGlobal("fetch", fetchFalso);
    render(<Editores />);
    expect(screen.getByText("Solo correos @uabc.edu.mx")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: "alguien@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreta-123" } });
    fireEvent.change(screen.getByLabelText("Repite la contraseña"), { target: { value: "secreta-123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Crear mi cuenta" }).closest("form"));
    expect(screen.getByRole("alert").textContent).toMatch(/correo institucional/);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});

describe("crear cuenta, confirmar y cambiar la contraseña desde la pantalla", () => {
  const preparar = (respuesta = { ok: true, mensaje: "Listo. Te mandamos un correo." }) => {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    sessionStorage.clear();
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => respuesta }));
    vi.stubGlobal("fetch", f);
    return f;
  };
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });

  it("crear mi cuenta: pide la contraseña dos veces y avisa que llegará un correo", async () => {
    const f = preparar();
    render(<Editores />);
    fireEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: "maestra@uabc.edu.mx" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "una-clave-larga" } });
    fireEvent.change(screen.getByLabelText("Repite la contraseña"), { target: { value: "otra-distinta-1" } });
    fireEvent.submit(screen.getByRole("button", { name: "Crear mi cuenta" }).closest("form"));
    expect(screen.getByRole("alert").textContent).toMatch(/no son iguales/);
    expect(f).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Repite la contraseña"), { target: { value: "una-clave-larga" } });
    fireEvent.submit(screen.getByRole("button", { name: "Crear mi cuenta" }).closest("form"));
    expect(await screen.findByText("Listo. Te mandamos un correo.")).toBeTruthy();
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ accion: "crear", correo: "maestra@uabc.edu.mx", contrasena: "una-clave-larga" });
  });

  it("¿olvidaste tu contraseña?: solo pide el correo", async () => {
    const f = preparar({ ok: true, mensaje: "Si tiene cuenta, te llegará un correo." });
    render(<Editores />);
    fireEvent.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }));
    expect(screen.queryByLabelText("Contraseña")).toBeNull();
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: "maestra@uabc.edu.mx" } });
    fireEvent.submit(screen.getByRole("button", { name: "Mandarme el enlace" }).closest("form"));
    expect(await screen.findByText("Si tiene cuenta, te llegará un correo.")).toBeTruthy();
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ accion: "recuperar", correo: "maestra@uabc.edu.mx" });
  });

  it("al volver del enlace de confirmación lo dice, y borra el enlace de la barra", () => {
    preparar();
    window.history.replaceState(null, "", "/admin#access_token=abc&type=signup");
    render(<Editores />);
    expect(screen.getByText(/Tu correo quedó confirmado/)).toBeTruthy();
    expect(window.location.hash).toBe("");
  });

  it("con el enlace de «olvidé mi contraseña» pide la nueva y la manda con el token", async () => {
    const f = preparar({ ok: true });
    window.history.replaceState(null, "", "/admin#access_token=token-del-correo-123456789&type=recovery");
    render(<Editores />);
    fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: "nueva-clave-99" } });
    fireEvent.change(screen.getByLabelText("Repite la contraseña"), { target: { value: "nueva-clave-99" } });
    fireEvent.submit(screen.getByRole("button", { name: "Guardar la contraseña" }).closest("form"));
    expect(await screen.findByText(/Tu contraseña quedó cambiada/)).toBeTruthy();
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ accion: "contrasenaNueva", token: "token-del-correo-123456789", contrasena: "nueva-clave-99" });
    expect(window.location.hash).toBe("");
  });

  it("un enlace vencido avisa que hay que pedir otro", () => {
    preparar();
    window.history.replaceState(null, "", "/admin#error=access_denied&error_description=Email+link+is+invalid+or+has+expired");
    render(<Editores />);
    expect(screen.getByRole("alert").textContent).toMatch(/venció o ya se usó/);
  });
});
