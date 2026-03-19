import Groq from "groq-sdk";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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

    return res.status(200).json({ text: completion.choices[0]?.message?.content || "NO" });
  } catch (err: any) {
    const cause = err.cause ? ` (Cause: ${err.cause.message || JSON.stringify(err.cause)})` : '';
    return res.status(500).json({ error: err.message + cause });
  }
}
