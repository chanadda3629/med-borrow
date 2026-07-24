interface ChatMessage { role: "system" | "user" | "assistant"; content: string }

export async function callOpenRouter(
  messages: ChatMessage[],
  model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash"
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  // A hung provider would otherwise block the request forever — the caller's
  // try/catch only catches thrown errors, not a stalled connection. AbortSignal
  // surfaces the timeout as a thrown error, so the existing fallback path handles it.
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://med-borrow.vercel.app", "X-Title": "Med Borrow" },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content ?? ""
}
