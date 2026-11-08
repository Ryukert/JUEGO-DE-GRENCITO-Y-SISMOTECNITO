import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Tropiezo from "./components/Tropiezo.jsx";
import { iniciarReporteDeErrores } from "./lib/errores.js";
import "./styles.css";
import "./estilos/minijuegos/index.js";   // en orden, después de styles.css

// errores del navegador → /api/error (registro de Vercel); solo en la versión publicada
if (import.meta.env.PROD) iniciarReporteDeErrores();

// sin internet después de la primera visita (public/sw.js); solo en la versión publicada
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

// /editores: resultados de las encuestas para quienes hacen el juego (se carga aparte)
const Editores = React.lazy(() => import("./pages/Editores.jsx"));
const esEditores = /^\/editores\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Tropiezo>
    {esEditores ? (
      <React.Suspense fallback={<p style={{ padding: 24 }}>Cargando…</p>}>
        <Editores />
      </React.Suspense>
    ) : (
      <App />
    )}
    </Tropiezo>
  </React.StrictMode>
);
