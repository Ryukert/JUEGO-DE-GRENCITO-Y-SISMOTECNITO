/* Interfaz: botón «atrás», chat que se esconde si no está, reloj único, atajos de teclado,
   ajustes, vibración, tutorial, «seguir jugando», mis logros, panel lateral y app instalable. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import React from "react";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import App from "../src/App.jsx";
import Reto from "../src/components/Reto.jsx";
import Reloj from "../src/components/Reloj.jsx";
import Juego from "../src/components/Juego.jsx";
import Logros from "../src/pages/Logros.jsx";
import PantallaMinijuego from "../src/juegos/PantallaMinijuego.jsx";
import { PERSONAJES } from "../src/data/personajes.js";
import { POR_ID, JUEGOS } from "../src/juegos/registro.js";
import { RANGOS, borrarProgreso, leerProgreso, registrarMinijuego, registrarPartida } from "../src/lib/progreso.js";
import { reiniciarPreferencias, guardarPreferencia } from "../src/lib/preferencias.js";
import { reiniciarChat } from "../src/lib/chat.js";
import { sonido } from "../src/lib/sonido.js";

const raiz = (f) => resolve(process.cwd(), f);

function chatResponde(disponible) {
  global.fetch = vi.fn(async (url, op = {}) =>
    (op.method || "GET") === "GET"
      ? { ok: true, status: 200, json: async () => ({ disponible }) }
      : { ok: false, status: 503, json: async () => ({}) }
  );
}

beforeEach(() => {
  localStorage.clear();
  borrarProgreso();
  reiniciarPreferencias();
  reiniciarChat();
  window.history.replaceState(null, "");
  window.AudioContext = undefined;
  HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} });
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  Element.prototype.scrollIntoView = function () {};
  chatResponde(false);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const atras = () => act(() => { window.dispatchEvent(new PopStateEvent("popstate", { state: null })); });

describe("botón «atrás» del navegador y del teléfono", () => {
  it("del Centro regresa a la portada en lugar de salirse", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    fireEvent.click(screen.getByText(/Centro de entrenamiento/));
    expect(document.querySelector(".centro")).toBeTruthy();
    expect(window.history.state).toEqual({ escuadron: true });
    atras();
    expect(document.querySelector(".portada")).toBeTruthy();
  });

  it("de un minijuego regresa al Centro, y del Centro a la portada", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    fireEvent.click(screen.getByText(/Centro de entrenamiento/));
    fireEvent.click(document.querySelector(".tarjeta:not([disabled])"));
    expect(document.querySelector(".jm__intro")).toBeTruthy();
    atras();
    expect(document.querySelector(".centro")).toBeTruthy();
    atras();
    expect(document.querySelector(".portada")).toBeTruthy();
  });

  it("con Ajustes abiertos, «atrás» solo los cierra", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Ajustes"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    atras();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".portada")).toBeTruthy();
  });
});

describe("chat que se esconde si no está encendido", () => {
  const p = PERSONAJES.sismo;
  const mision = p.misiones.find((m) => m.tipo === "reto");
  const montar = () =>
    render(<Reto personaje={p} grado="primaria" mision={mision} vidas={3} puntos={0} racha={0} onPuntos={() => {}} onFallo={() => {}} onFin={() => {}} />);

  it("sin llave en el servidor: no hay campo y se explica por qué", async () => {
    montar();
    await waitFor(() => expect(document.querySelector(".sin-chat")).toBeTruthy());
    expect(document.querySelector(".escribe")).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith("/api/chat", { method: "GET" });
  });

  it("con chat encendido aparece «Pregúntale algo»", async () => {
    chatResponde(true);
    montar();
    await waitFor(() => expect(screen.getByPlaceholderText(/Pregúntale algo/)).toBeTruthy());
  });

  it("si una pregunta falla, el personaje contesta algo en vez de quedarse callado", async () => {
    chatResponde(true);
    montar();
    const campo = await screen.findByPlaceholderText(/Pregúntale algo/);
    fireEvent.change(campo, { target: { value: "¿Por qué tiembla?" } });
    fireEvent.submit(campo.closest("form"));
    await waitFor(() => expect(screen.getByText(/Ahorita no puedo platicar/)).toBeTruthy());
    // el 503 apagó el chat
    await waitFor(() => expect(document.querySelector(".escribe")).toBeNull());
  });
});

describe("un solo reloj en todo el juego", () => {
  it("verde, amarillo, rojo y gris cuando no corre", () => {
    const nivel = (t, total) => {
      const { container } = render(<Reloj tiempo={t} total={total} />);
      const c = container.querySelector(".reloj").className.split("--")[1];
      cleanup();
      return c;
    };
    expect(nivel(20, 22)).toBe("verde");
    expect(nivel(10, 22)).toBe("amarillo");
    expect(nivel(4, 22)).toBe("rojo");
    expect(nivel(0, 22)).toBe("fin");
    // con 5 s por pieza, rojo hasta el último 30 %
    expect(nivel(4, 5)).toBe("verde");
    expect(nivel(1.4, 5)).toBe("rojo");
  });

  it("los minijuegos del Centro y de las misiones usan el reloj nuevo, con su moneda y «pts»", () => {
    const juego = POR_ID["quiz-relampago"];
    render(<PantallaMinijuego juego={juego} personaje={PERSONAJES[juego.personaje]} grado="primaria" progreso={leerProgreso()} onSalir={() => {}} />);
    fireEvent.click(screen.getByText("¡Empezar!"));
    expect(document.querySelector(".reloj .reloj__numero b")).toBeTruthy();
    expect(document.querySelector(".cronometro")).toBeNull();
    expect(document.querySelector(".jm__puntos .icono--estrella")).toBeTruthy();
    expect(document.querySelector(".jm__puntos").textContent).toContain("pts");
  });
});

describe("atajos de teclado", () => {
  it("1-4 o A-D eligen la respuesta y el foco pasa a «Siguiente»", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    fireEvent.click(screen.getByText("Sismo Tecnito"));
    fireEvent.click(screen.getByText("Saltar"));
    const botones = [...document.querySelectorAll(".opciones button")];
    const segunda = botones[1].textContent.slice(1);
    fireEvent.keyDown(document.body, { key: "2" });
    expect(document.querySelector(".fila--mia .globo").textContent).toBe(segunda);
    const seguir = document.querySelector(".boton-grande");
    expect(document.activeElement).toBe(seguir);
  });

  it("no roban letras mientras se escribe", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    fireEvent.click(screen.getByText("Sismo Tecnito"));
    fireEvent.click(screen.getByText("Saltar"));
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "a" });
    expect(document.querySelector(".fila--mia")).toBeNull();
    input.remove();
  });
});

describe("ajustes", () => {
  it("letra grande y menos animaciones se aplican a la página y se recuerdan", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Ajustes"));
    const letra = screen.getByRole("switch", { name: "Letra grande" });
    expect(letra.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(letra);
    expect(letra.getAttribute("aria-checked")).toBe("true");
    expect(document.documentElement.dataset.letra).toBe("grande");
    fireEvent.click(screen.getByRole("switch", { name: "Menos animaciones" }));
    expect(document.documentElement.dataset.movimiento).toBe("reducido");
    expect(JSON.parse(localStorage.getItem("escuadron-preferencias"))).toMatchObject({ letraGrande: true, menosMovimiento: true });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("borrar el progreso pide confirmación", () => {
    registrarMinijuego("quiz-relampago", { score: 50, xp: 30, completed: true, dificultad: "facil", accuracy: 80, reward: {} });
    render(<App />);
    fireEvent.click(screen.getByLabelText("Ajustes"));
    fireEvent.click(screen.getByText("Borrar mi progreso"));
    expect(leerProgreso().xp).toBe(30);
    fireEvent.click(screen.getByText("Sí, borrar todo"));
    expect(leerProgreso().xp).toBe(0);
    expect(screen.getByText(/el progreso se borró/)).toBeTruthy();
  });
});

describe("vibración", () => {
  it("vibra al acertar y al fallar, salvo que se apague", () => {
    navigator.vibrate = vi.fn();
    sonido.bien();
    sonido.mal();
    expect(navigator.vibrate).toHaveBeenCalledTimes(2);
    guardarPreferencia("vibracion", false);
    sonido.bien();
    expect(navigator.vibrate).toHaveBeenCalledTimes(2);
    delete navigator.vibrate;
  });
});

describe("tutorial y «seguir jugando»", () => {
  it("la explicación sale solo la primera vez y la portada ofrece seguir con el mismo personaje", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Primaria"));
    fireEvent.click(screen.getByText("Greencito"));
    expect(screen.getByRole("dialog", { name: /reloj/ })).toBeTruthy();
    fireEvent.click(screen.getByText("Siguiente"));
    fireEvent.click(screen.getByText("Siguiente"));
    fireEvent.click(screen.getByText("¡A jugar!"));
    expect(document.querySelector(".hud")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Volver al inicio"));
    const seguir = screen.getByText("Seguir con Greencito");
    fireEvent.click(seguir);
    expect(screen.queryByText("Saltar")).toBeNull(); // ya no repite el tutorial
    expect(document.querySelector(".hud h1").textContent).toBe("Greencito");
  });
});

describe("mis logros", () => {
  it("muestra cifras, medallas ganadas, insignias y juegos jugados", () => {
    registrarPartida({ personaje: "sismo", puntos: 250, insignias: [PERSONAJES.sismo.misiones[0].titulo] });
    registrarMinijuego("quiz-relampago", { score: 50, xp: 30, completed: true, dificultad: "facil", accuracy: 80, reward: {} });
    render(<Logros progreso={leerProgreso()} onSalir={() => {}} />);
    expect(document.querySelectorAll(".logros__medallas li.ganada").length).toBe(3); // Aprendiz, Vigilante, Guardián
    expect(document.querySelectorAll(".logros__medallas li").length).toBe(RANGOS.length);
    expect(document.querySelectorAll(".logros__insignias li.ganada").length).toBe(1);
    expect(document.querySelectorAll(".logros__juegos li").length).toBe(JUEGOS.length);
    expect(document.querySelectorAll(".logros__juegos li.jugado").length).toBe(1);
    expect(screen.getByText("1 jugados · 0 dominados")).toBeTruthy();
  });

  it("se abre desde la portada y regresa a ella", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Mis logros"));
    expect(document.querySelector(".logros")).toBeTruthy();
    fireEvent.click(screen.getByText("Volver"));
    expect(document.querySelector(".portada")).toBeTruthy();
  });
});

describe("panel lateral de la partida", () => {
  it("lista las misiones con la actual marcada, los puntos y los atajos", () => {
    const p = PERSONAJES.sismo;
    render(
      <Juego personaje={p} grado="primaria" mision={p.misiones[1]} nivel={1} puntos={40} vidas={3} racha={2} record={120}
        temblor={false} sonidoOn onSonido={() => {}} onPuntos={() => {}} onFallo={() => {}} onFinMision={() => {}} onSalir={() => {}} />
    );
    const items = document.querySelectorAll(".mesa__misiones li");
    expect(items.length).toBe(p.misiones.length);
    expect(items[0].className).toBe("hecha");
    expect(items[1].className).toBe("actual");
    expect(document.querySelector(".mesa__datos").textContent).toContain("120");
    expect(document.querySelector(".mesa__atajos kbd")).toBeTruthy();
  });
});

describe("app instalable y sin internet", () => {
  it("manifiesto con iconos que existen, enlazado desde la página", () => {
    const m = JSON.parse(readFileSync(raiz("public/manifest.webmanifest"), "utf8"));
    expect(m.display).toBe("standalone");
    expect(m.icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const i of m.icons) expect(existsSync(raiz("public" + i.src)), i.src).toBe(true);
    expect(readFileSync(raiz("index.html"), "utf8")).toContain('rel="manifest"');
  });

  it("el service worker no guarda el chat y solo se registra en la versión publicada", () => {
    const sw = readFileSync(raiz("public/sw.js"), "utf8");
    expect(sw).toContain('startsWith("/api/")');
    expect(readFileSync(raiz("src/main.jsx"), "utf8")).toMatch(/import\.meta\.env\.PROD && "serviceWorker" in navigator/);
    const v = JSON.parse(readFileSync(raiz("vercel.json"), "utf8"));
    expect(v.headers.find((h) => h.source === "/sw.js").headers).toContainEqual({ key: "Cache-Control", value: "no-cache" });
  });
});
