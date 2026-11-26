import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Tropiezo from "./components/Tropiezo.jsx";
import { iniciarReporteDeErrores } from "./lib/errores.js";
import { registrarVisita } from "./lib/visitas.js";
import "./styles.css";
import "./estilos/minijuegos/index.js";   // en orden, después de styles.css

// errores del navegador → /api/error (registro de Vercel); solo en la versión publicada
if (import.meta.env.PROD) iniciarReporteDeErrores();

// sin internet después de la primera visita (public/sw.js); solo en la versión publicada
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

// administración de encuestas: /admin, /administradores o /editores (se carga aparte)
const Editores = React.lazy(() => import("./pages/Editores.jsx"));
const esEditores = /^\/(editores|admin|administradores)\/?$/.test(window.location.pathname);
// evaluación abierta, para cualquiera y sin cuenta: /opinion, /evaluacion o /califica
const Opinion = React.lazy(() => import("./pages/Opinion.jsx"));
const esOpinion = /^\/(opinion|opinión|evaluacion|evaluación|califica)\/?$/i.test(decodeURIComponent(window.location.pathname));

// contador de visitas: una por navegador al día (no cuenta la administración); solo en la versión publicada
if (import.meta.env.PROD && !esEditores) registrarVisita();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Tropiezo>
    {esEditores || esOpinion ? (
      <React.Suspense fallback={<p style={{ padding: 24 }}>Cargando…</p>}>
        {esEditores ? <Editores /> : <Opinion />}
      </React.Suspense>
    ) : (
      <App />
    )}
    </Tropiezo>
  </React.StrictMode>
);
