import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * En producción, Vercel ejecuta /api/chat.js como función serverless.
 * En local (npm run dev) montamos el mismo archivo como middleware
 * para que el juego funcione igual sin instalar el CLI de Vercel.
 */
function apiLocal() {
  return {
    name: "api-local",
    configureServer(server) {
      server.middlewares.use("/api/chat", async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule("/api/chat.js");
          await handler(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiLocal()],
  server: { port: 5173, host: true },
  build: { outDir: "dist", target: "es2020" },
});
