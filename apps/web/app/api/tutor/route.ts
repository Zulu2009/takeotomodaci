import { NextRequest, NextResponse } from "next/server";

type TutorMode = "fun-chat" | "training-5" | "training-10";

type TutorPayload = {
  message?: string;
  mode?: TutorMode;
  userId?: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function systemPromptForMode(mode: TutorMode) {
  if (mode === "training-5") {
    return "You are Sensei Suki teaching a 5-minute Japanese drill. Keep responses concise, focused, and include one short follow-up question plus one mini challenge.";
  }

  if (mode === "training-10") {
    return "You are Sensei Suki teaching a 10-minute Japanese practice. Build a deeper mini-lesson with kana, romaji, and English, then ask one practice question and one recall prompt.";
  }

  return "You are Sensei Suki, a fun Japanese tutor for kids. Keep things friendly, short, and clear with kana, romaji, and English. Make responses lively and interactive.";
}

function extractTutorText(data: OpenAIResponse): string {
  if (data.output_text?.trim()) return data.output_text.trim();

  const chunks: string[] = [];
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if ((part.type === "output_text" || part.type === "text") && part.text?.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }

  return chunks.join("\n\n").trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing on the server. Add it in environment variables and redeploy." },
      { status: 500 },
    );
  }

  let payload: TutorPayload;
  try {
    payload = (await request.json()) as TutorPayload;
  } catch (error) {
    console.error("Invalid /api/tutor JSON body", error);
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const message = payload.message?.trim();
  const mode = payload.mode ?? "fun-chat";
  const userId = payload.userId?.trim();

  if (!message || !userId) {
    return NextResponse.json({ error: "Fields required: message, mode, userId." }, { status: 400 });
  }

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: systemPromptForMode(mode),
          },
          {
            role: "user",
            content: `User ${userId} asks: ${message}`,
          },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const detail = await openaiResponse.text();
      console.error("OpenAI API error", { status: openaiResponse.status, detail });
      return NextResponse.json({ error: "Tutor provider request failed." }, { status: 502 });
    }

    const data = (await openaiResponse.json()) as OpenAIResponse;
    const text = extractTutorText(data);

    if (!text) {
      console.error("OpenAI response missing text", data);
      return NextResponse.json({ text: "Nice effort. Ask me another Japanese question and I will coach you step by step." });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Unexpected /api/tutor error", error);
    return NextResponse.json({ error: "Unexpected tutor server error." }, { status: 500 });
  }
}
