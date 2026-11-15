import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const BASE = (process.env.TOKENS_BASE_URL || "https://tokens.bd").replace(/\/$/, "");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

function requireKey(req, res, next) {
  if (!process.env.TOKENS_API_KEY) {
    return res.status(503).json({ error: "API key is not configured. Add TOKENS_API_KEY to your .env file and restart the app." });
  }
  next();
}

app.get("/api/models", requireKey, async (_req, res) => {
  try {
    const response = await fetch(`${BASE}/v1/models`, {
      headers: { Authorization: `Bearer ${process.env.TOKENS_API_KEY}` }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Could not load models." });
    const models = (data.data || []).map(item => ({ id: item.id, name: item.name || item.id })).filter(item => item.id);
    res.json({ models });
  } catch {
    res.status(502).json({ error: "Could not reach Tokens.bd. Check your internet connection." });
  }
});

app.post("/api/chat", requireKey, async (req, res) => {
  const { model, messages, max_tokens = 2048, stream = false } = req.body || {};
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "A model and at least one message are required." });
  }
  if (messages.length > 60) return res.status(400).json({ error: "Conversation is too long. Start a new chat." });

  try {
    const upstream = await fetch(`${BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.TOKENS_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({ model, max_tokens, messages, stream })
    });
    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json");
    res.setHeader("cache-control", "no-cache");
    if (stream && upstream.body) {
      for await (const chunk of upstream.body) {
        if (res.destroyed) break;
        res.write(chunk);
      }
      return res.end();
    }
    const body = await upstream.text();
    return res.send(body);
  } catch {
    return res.status(502).json({ error: "Tokens.bd request failed. Please try again." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, configured: Boolean(process.env.TOKENS_API_KEY) }));

app.listen(PORT, () => console.log(`Positron AI is running at http://localhost:${PORT}`));
