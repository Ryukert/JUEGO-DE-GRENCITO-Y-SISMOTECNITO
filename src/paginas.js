/**
 * Pantallas que no hacen falta para empezar a jugar: se descargan la primera vez que se abren
 * (igual que los motores de minijuegos, con src/juegos/diferido.jsx). Así la portada pesa menos.
 * El service worker también las guarda para usarlas sin internet (version-sw.js).
 */
import { diferido } from "./juegos/diferido.jsx";

export const Logros = diferido(() => import("./pages/Logros.jsx"), "default", { cargando: "Cargando tus logros…" });
export const Maestro = diferido(() => import("./pages/Maestro.jsx"), "default", { cargando: "Cargando el panel…" });
export const Repaso = diferido(() => import("./pages/Repaso.jsx"), "default", { cargando: "Cargando el repaso…" });

/** Las pruebas las descargan antes, para montarlas sin esperar. */
export const precargarPaginas = () => Promise.all([Logros, Maestro, Repaso].map((p) => p.precargar()));
