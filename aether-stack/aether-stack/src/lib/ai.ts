/**
 * AI provider.
 *  - OPENAI_API_KEY  -> OpenAI chat completions
 *  - ANTHROPIC_API_KEY -> Anthropic messages
 *  - neither         -> deterministic mock, clearly labelled as mock output
 * The mock keeps the whole pipeline exercisable with no key and no cost.
 */
export type AiCall = { prompt: string; input: string; model: string };
export type AiProvider = (call: AiCall) => Promise<string>;

export function aiMode(): "openai" | "anthropic" | "mock" {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "mock";
}

async function callOpenAI({ prompt, input, model }: AiCall): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || model || "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: input || "(no input provided)" },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return j.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callAnthropic({ prompt, input, model }: AiCall): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || model || "claude-sonnet-4-5",
      max_tokens: 1024,
      system: prompt,
      messages: [{ role: "user", content: input || "(no input provided)" }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { content?: { text?: string }[] };
  return j.content?.map((c) => c.text ?? "").join("").trim() ?? "";
}

/** Deterministic mock. Never pretends to be a real model. */
export function mockProvider(): AiProvider {
  return async ({ prompt, input }) => {
    const seed = (input || "").trim();
    return [
      "[MOCK AI — no API key set]",
      "",
      `Instruction applied: ${prompt.slice(0, 180)}${prompt.length > 180 ? "…" : ""}`,
      "",
      "Output:",
      seed
        ? `• Input received (${seed.length} chars): ${seed.slice(0, 400)}${seed.length > 400 ? "…" : ""}`
        : "• No input was supplied to this step.",
      "",
      "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local to replace this with a real model call.",
    ].join("\n");
  };
}

export function resolveProvider(): AiProvider {
  const mode = aiMode();
  if (mode === "openai") return callOpenAI;
  if (mode === "anthropic") return callAnthropic;
  return mockProvider();
}
