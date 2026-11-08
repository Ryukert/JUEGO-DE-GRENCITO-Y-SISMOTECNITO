import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { versionServiceWorker } from "./version-sw.js";   // cada versión publicada, un sw.js distinto

/**
 * En producción, Vercel ejecuta cada archivo de /api como función serverless.
 * En local (npm run dev) montamos los mismos archivos como middleware
 * para que el juego funcione igual sin instalar el CLI de Vercel.
 */
const FUNCIONES = ["chat", "alumno", "progreso", "grupo", "evaluacion", "encuesta", "editores"];

function apiLocal() {
  return {
    name: "api-local",
    configureServer(server) {
      // las variables de .env.local (sin prefijo VITE_) solo las ve el servidor, nunca el navegador
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ""), { ...process.env });
      for (const nombre of FUNCIONES) {
        server.middlewares.use(`/api/${nombre}`, async (req, res, next) => {
          if (req.url && req.url !== "/" && !req.url.startsWith("/?")) return next();
          try {
            const { default: handler } = await server.ssrLoadModule(`/api/${nombre}.js`);
            await handler(req, res);
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), apiLocal(), versionServiceWorker()],
  server: { port: 5173, host: true },
  build: { outDir: "dist", target: "es2020" },
});
