/* Cuentas de grupo en el juego (src/lib/cuenta.js): cada alumno con su propio progreso en el
   equipo, respuestas en cola cuando no hay internet, y el botón «Mi grupo» solo si hay base de datos. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import App from "../src/App.jsx";
import { leerProgreso, registrarMinijuego, usarCuenta, borrarProgreso } from "../src/lib/progreso.js";
import {
  entrarAlumno, salirAlumno, anotarRespuesta, sincronizar, leerCuenta, reiniciarCuenta,
} from "../src/lib/cuenta.js";
import { reiniciarPreferencias } from "../src/lib/preferencias.js";

const ALUMNO = {
  pase: "pase-de-prueba",
  alumno: { id: "a1", apodo: "Ana", avatar: "green" },
  grupo: { codigo: "ABC234", nombre: "5° B", grado: "secundaria" },
  progreso: { grado: "secundaria", xp: 500, records: { sismo: 260 } },
};

let enviados;
function servidor({ disponible = true, progreso = 401 } = {}) {
  enviados = [];
  global.fetch = vi.fn(async (url, op = {}) => {
    const metodo = op.method || "GET";
    const cuerpo = op.body ? JSON.parse(op.body) : null;
    enviados.push({ url, metodo, cuerpo, pase: op.headers?.Authorization });
    const ok = (d) => ({ ok: true, status: 200, json: async () => d });
    if (url === "/api/alumno" && metodo === "GET") return ok({ disponible });
    if (url === "/api/alumno") return ok(ALUMNO);
    if (url === "/api/progreso" && metodo === "PUT") {
      if (progreso === 401) return { ok: false, status: 401, json: async () => ({ error: "fuera" }) };
      return ok({ progreso: cuerpo.progreso, guardadas: cuerpo.respuestas.length });
    }
    if (url === "/api/progreso") return ok({ progreso: ALUMNO.progreso, alumno: ALUMNO.alumno, grupo: ALUMNO.grupo });
    return ok({ disponible: false });
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  reiniciarCuenta();
  borrarProgreso();
  reiniciarPreferencias();
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  window.AudioContext = undefined;
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  servidor();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); reiniciarCuenta(); });

describe("varios alumnos en el mismo equipo", () => {
  it("cada cuenta tiene su progreso y no toca el de quien juega sin cuenta", () => {
    registrarMinijuego("memorama", { score: 40, xp: 30, completed: true, dificultad: "facil" });
    usarCuenta("ana");
    expect(leerProgreso().xp).toBe(0);
    registrarMinijuego("memorama", { score: 90, xp: 70, completed: true, dificultad: "medio" });
    usarCuenta("beto");
    expect(leerProgreso().xp).toBe(0);
    usarCuenta(null);
    expect(leerProgreso().xp).toBe(30);
    usarCuenta("ana");
    expect(leerProgreso().juegos.memorama.record).toBe(90);
  });
});

describe("entrar, guardar y salir", () => {
  it("al entrar abre el progreso del alumno combinado con el de la base de datos", async () => {
    servidor({ progreso: 200 });
    await entrarAlumno({ accion: "entrar", codigo: "ABC234", apodo: "Ana", pin: "1234" });
    expect(leerCuenta().alumno.apodo).toBe("Ana");
    expect(leerProgreso()).toMatchObject({ xp: 500, grado: "secundaria", records: { sismo: 260 } });
    expect(JSON.parse(localStorage.getItem("escuadron-cuenta")).pase).toBe("pase-de-prueba");
  });

  it("las respuestas esperan en cola y se mandan con el pase; luego la cola se vacía", async () => {
    servidor({ progreso: 200 });
    await entrarAlumno({ accion: "entrar", codigo: "ABC234", apodo: "Ana", pin: "1234" });
    anotarRespuesta({ personaje: "sismo", grado: "secundaria", mision: "s1", bono: false, eleccion: "x" });
    anotarRespuesta({ personaje: "sismo", grado: "secundaria", mision: "s3", bono: false, eleccion: null });
    await sincronizar();
    const put = enviados.filter((e) => e.metodo === "PUT").pop();
    expect(put.pase).toBe("Bearer pase-de-prueba");
    expect(put.cuerpo.respuestas).toHaveLength(2);
    expect(put.cuerpo.progreso.xp).toBe(500);
    expect(localStorage.getItem("escuadron-pendientes:a1")).toBeNull();
  });

  it("sin cuenta no se anota nada", () => {
    anotarRespuesta({ personaje: "sismo", mision: "s1", eleccion: "x" });
    expect(Object.keys(localStorage).filter((k) => k.startsWith("escuadron-pendientes"))).toEqual([]);
  });

  it("si el maestro lo quitó (401) vuelve a modo sin cuenta sin borrar nada del equipo", async () => {
    servidor({ progreso: 401 });
    await entrarAlumno({ accion: "entrar", codigo: "ABC234", apodo: "Ana", pin: "1234" });
    await sincronizar().catch(() => {});
    expect(leerCuenta()).toBeNull();
    expect(localStorage.getItem("escuadron-cuenta")).toBeNull();
    expect(localStorage.getItem("escuadron-progreso-v2:a1")).not.toBeNull();
  });

  it("al salir regresa al progreso de quien juega sin cuenta", async () => {
    servidor({ progreso: 200 });
    await entrarAlumno({ accion: "entrar", codigo: "ABC234", apodo: "Ana", pin: "1234" });
    await salirAlumno();
    expect(leerCuenta()).toBeNull();
    expect(leerProgreso().xp).toBe(0);
  });
});

describe("botón «Mi grupo»", () => {
  it("no aparece si el servidor no tiene base de datos", async () => {
    servidor({ disponible: false });
    render(<App />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /Mi grupo/ })).toBeNull();
  });

  it("aparece si la hay y abre los formularios de alumno y maestro", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Mi grupo/ }));
    expect(screen.getByRole("dialog", { name: /Mi grupo/ })).toBeTruthy();
    expect(screen.getByLabelText(/Código del grupo/)).toBeTruthy();
    expect(screen.getByLabelText(/Tu PIN/)).toHaveProperty("type", "password");
    fireEvent.click(screen.getByRole("tab", { name: "Soy maestro" }));
    fireEvent.click(screen.getByRole("tab", { name: "Crear un grupo" }));
    expect(screen.getByLabelText(/Nombre del grupo/)).toBeTruthy();
    expect(screen.getByLabelText(/Repite la clave/)).toBeTruthy();
  });

  it("con cuenta guardada abre directo con el apodo y el progreso del alumno", async () => {
    servidor({ progreso: 200 });
    localStorage.setItem("escuadron-cuenta", JSON.stringify({ pase: "p", alumno: ALUMNO.alumno, grupo: ALUMNO.grupo }));
    localStorage.setItem("escuadron-progreso-v2:a1", JSON.stringify({ version: 2, grado: "secundaria", xp: 77, records: { sismo: 0, green: 0 } }));
    render(<App />);
    expect(await screen.findByRole("button", { name: /Ana/ })).toBeTruthy();
    expect(leerProgreso().xp).toBeGreaterThanOrEqual(77);
  });
});

describe("evaluar al maestro", () => {
  it("cada pregunta son cinco caritas de colores que se eligen como botones de radio", async () => {
    const { Caritas } = await import("../src/components/Evaluacion.jsx");
    const cambio = vi.fn();
    render(<Caritas nombre="explica" titulo="¿Tu maestro explica claro?" valor={4} onCambiar={cambio} />);
    const grupo = screen.getByRole("group", { name: "¿Tu maestro explica claro?" });
    const radios = screen.getAllByRole("radio");
    expect(grupo).toBeTruthy();
    expect(radios).toHaveLength(5);
    expect(screen.getByRole("radio", { name: /Bien/ }).checked).toBe(true);
    expect(grupo.textContent).toContain("😡");
    expect(grupo.textContent).toContain("😄");
    fireEvent.click(screen.getByRole("radio", { name: /Muy bien/ }));
    expect(cambio).toHaveBeenCalledWith(5);
    const colores = [...grupo.querySelectorAll(".carita")].map((l) => l.style.getPropertyValue("--carita"));
    expect(colores[0]).toBe("#d63a2a");
    expect(colores[4]).toBe("#2c9c48");
  });

  it("con cuenta, «Mi grupo» ofrece evaluar al maestro", async () => {
    servidor({ progreso: 200 });
    localStorage.setItem("escuadron-cuenta", JSON.stringify({ pase: "p", alumno: ALUMNO.alumno, grupo: ALUMNO.grupo }));
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Ana/ }));
    fireEvent.click(screen.getByRole("button", { name: /Evaluar a mi maestro/ }));
    expect(await screen.findByRole("group", { name: /explica claro/ })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(15);
  });
});

describe("encuesta de satisfacción al terminar un juego", () => {
  let mandadas;
  async function preparar({ disponible = true } = {}) {
    const { reiniciarEncuestas } = await import("../src/lib/encuestas.js");
    reiniciarEncuestas();
    mandadas = [];
    global.fetch = vi.fn(async (url, op = {}) => {
      if (url === "/api/encuesta" && (op.method || "GET") === "GET") return { ok: true, status: 200, json: async () => ({ disponible }) };
      if (url === "/api/encuesta") { mandadas.push(JSON.parse(op.body)); return { ok: true, status: 200, json: async () => ({ ok: true }) }; }
      return { ok: true, status: 200, json: async () => ({ disponible: false }) };
    });
    return (await import("../src/components/Encuesta.jsx")).default;
  }
  const JUEGO = { id: "memorama", tipo: "minijuego", nombre: "Memorama" };

  it("pregunta si le gustó y qué tan difícil, y se manda sola al contestar las dos", async () => {
    const Encuesta = await preparar();
    render(<Encuesta juego={JUEGO} grado="primaria" />);
    expect(await screen.findByRole("heading", { name: /Qué te pareció Memorama/ })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(8);   // 5 caritas + 3 de dificultad
    fireEvent.click(screen.getByRole("radio", { name: /Muy bien/ }));
    expect(mandadas).toHaveLength(0);
    fireEvent.click(screen.getByRole("radio", { name: /Muy difícil/ }));
    expect(await screen.findByText(/Gracias/)).toBeTruthy();
    await waitFor(() => expect(mandadas).toEqual([{ juego: "memorama", tipo: "minijuego", gusto: 5, dificultad: 3, grado: "primaria" }]));
  });

  it("no vuelve a preguntar por el mismo juego el mismo día", async () => {
    const Encuesta = await preparar();
    const { unmount } = render(<Encuesta juego={JUEGO} grado="primaria" />);
    fireEvent.click(await screen.findByRole("button", { name: "Ahora no" }));
    expect(screen.queryByRole("heading", { name: /Qué te pareció/ })).toBeNull();
    unmount();
    render(<Encuesta juego={JUEGO} grado="primaria" />);
    render(<Encuesta juego={{ id: "sopa", tipo: "minijuego", nombre: "Sopa" }} grado="primaria" />);
    expect(await screen.findByRole("heading", { name: /Qué te pareció Sopa/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Memorama/ })).toBeNull();
  });

  it("sin base de datos no aparece", async () => {
    const Encuesta = await preparar({ disponible: false });
    render(<Encuesta juego={JUEGO} grado="primaria" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByRole("heading", { name: /Qué te pareció/ })).toBeNull();
  });

  it("sin internet la respuesta espera y se manda con la siguiente", async () => {
    await preparar();
    const { enviarEncuesta } = await import("../src/lib/encuestas.js");
    const real = global.fetch;
    global.fetch = vi.fn(async () => { throw new Error("sin red"); });
    expect(await enviarEncuesta({ juego: "a", tipo: "minijuego", gusto: 3, dificultad: 2, grado: "primaria" })).toBe(false);
    global.fetch = real;
    expect(await enviarEncuesta({ juego: "b", tipo: "minijuego", gusto: 4, dificultad: 1, grado: "primaria" })).toBe(true);
    expect(mandadas.map((m) => m.juego)).toEqual(["a", "b"]);
    expect(localStorage.getItem("escuadron-encuestas-pendientes")).toBeNull();
  });
});
