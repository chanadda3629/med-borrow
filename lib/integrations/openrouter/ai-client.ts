interface ChatMessage { role: "system" | "user" | "assistant"; content: string }

export async function callOpenRouter(messages: ChatMessage[], model = "google/gemini-2.0-flash"): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://med-borrow.vercel.app", "X-Title": "Med Borrow" },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" } }),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content ?? ""
}
