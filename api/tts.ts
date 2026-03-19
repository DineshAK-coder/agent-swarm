export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
