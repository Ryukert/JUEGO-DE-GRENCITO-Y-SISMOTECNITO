/**
 * Función serverless (Vercel) que conversa con Claude.
 * La API key vive solo aquí, en el servidor. Nunca llega al navegador.
 *
 * Variable de entorno requerida: ANTHROPIC_API_KEY
 */

const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const MAX_MENSAJES = 10;

async function leerCuerpo(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const partes = [];
  for await (const trozo of req) partes.push(trozo);
  return JSON.parse(Buffer.concat(partes).toString("utf8") || "{}");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Usa POST" }));
  }

  const llave = process.env.ANTHROPIC_API_KEY;
  if (!llave) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({ error: "Falta ANTHROPIC_API_KEY en las variables de entorno" })
    );
  }

  try {
    const { system, messages } = await leerCuerpo(req);

    if (!Array.isArray(messages) || messages.length === 0) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Faltan mensajes" }));
    }

    const limpios = messages.slice(-MAX_MENSAJES).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content || "").slice(0, 2000),
    }));

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": llave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 700,
        temperature: 0.7,
        system: String(system || "").slice(0, 6000),
        messages: limpios,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      res.statusCode = r.status;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({ error: data?.error?.message || "Error de la API" })
      );
    }

    const texto = (data.content || [])
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ texto }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "No se pudo procesar la respuesta" }));
  }
}
