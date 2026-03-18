import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  app.post('/api/chat', async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        return res.status(400).json({ error: "GROQ_API_KEY not set in .env" });
      }

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: req.body.model || "llama-3.1-8b-instant",
        messages: req.body.messages,
        temperature: 0.7,
      });

      return res.json({ text: completion.choices[0]?.message?.content || "NO" });
    } catch (err: any) {
      const cause = err.cause ? ` (Cause: ${err.cause.message || JSON.stringify(err.cause)})` : '';
      return res.status(500).json({ error: err.message + cause });
    }
  });

  app.post('/api/tts', async (req, res) => {
    try {
      if (!process.env.MURF_API_KEY) {
        return res.status(400).json({ error: "MURF_API_KEY not set in .env" });
      }

      const response = await fetch('https://api.murf.ai/v1/speech/generate', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.MURF_API_KEY,
        },
        body: JSON.stringify({
          voiceId: req.body.voiceId || "en-US-marcus",
          style: "Conversational",
          text: req.body.text,
          format: "MP3"
        })
      });
      
      if (!response.ok) {
        const textError = await response.text();
        let errObj: any = {};
        try { errObj = JSON.parse(textError); } catch(e) {}
        return res.status(response.status).json({ error: errObj.message || textError || "Murf API Error" });
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
