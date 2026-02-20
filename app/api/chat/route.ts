import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000)
});

const RequestSchema = z.object({
  lessonDay: z.number().int().min(1).max(30),
  lessonPrompt: z.string().min(1).max(200),
  knownVocab: z.array(z.string()).max(1000),
  knownKanji: z.array(z.string()).max(1000),
  messages: z.array(MessageSchema).min(1).max(40)
});

const client = new OpenAI({ apiKey: env.openaiApiKey });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);

    const systemPrompt = [
      "You are a Japanese tutor for an 11-year-old.",
      "Use an encouraging, child-safe tone.",
      "Hard constraints:",
      "1) Introduce at most 5 new learning items in this session reply.",
      "2) Every new item must include: kana, romaji, and English meaning.",
      "3) End every response with exactly 3 short recall questions.",
      "4) Keep outputs concise and readable.",
      `5) Current lesson mode: Day ${parsed.lessonDay} - ${parsed.lessonPrompt}.`,
      `6) Avoid re-teaching these known vocab when possible: ${parsed.knownVocab.join(", ") || "none"}.`,
      `7) Avoid re-teaching these known kanji when possible: ${parsed.knownKanji.join(", ") || "none"}.`
    ].join("\n");

    const input = [
      { role: "system" as const, content: systemPrompt },
      ...parsed.messages.map((m) => ({ role: m.role, content: m.content }))
    ];

    const response = await client.chat.completions.create({
      model: env.openaiModel,
      messages: input,
      temperature: 0.4,
      max_tokens: 500
    });

    const reply = response.choices[0]?.message?.content?.trim();

    if (!reply) {
      return Response.json({ error: "No response text produced" }, { status: 502 });
    }

    const extractedVocab = Array.from(
      new Set(
        (reply.match(/[\u3040-\u309f]{2,}/g) ?? [])
          .map((v) => v.trim())
          .filter(Boolean)
      )
    ).slice(0, 15);

    const extractedKanji = Array.from(
      new Set(
        (reply.match(/[\u4e00-\u9faf]/g) ?? [])
          .map((k) => k.trim())
          .filter(Boolean)
      )
    ).slice(0, 15);

    return Response.json({ reply, extractedVocab, extractedKanji });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return Response.json({ error: message }, { status: 400 });
  }
}