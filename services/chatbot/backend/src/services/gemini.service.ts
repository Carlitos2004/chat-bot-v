import { config } from "../config/config.js"; 

export async function callGemini(prompt: string): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.gemini.model
  )}:generateContent?key=${encodeURIComponent(config.gemini.apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "Eres un asistente de soporte del Mini Marketplace Cloud. Responde solo en español.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as any;
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part: any) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini no retorno texto.");
  }

  return text;
}