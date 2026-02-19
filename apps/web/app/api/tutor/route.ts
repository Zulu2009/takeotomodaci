import { NextRequest, NextResponse } from "next/server";

type TutorMode = "fun-chat" | "training-5" | "training-10";

type TutorPayload = {
  message?: string;
  mode?: TutorMode;
  userId?: string;
};

function systemPromptForMode(mode: TutorMode) {
  if (mode === "training-5") {
    return "You are Sensei Suki teaching a 5-minute Japanese drill. Keep responses concise, focused, and include one short follow-up question.";
  }

  if (mode === "training-10") {
    return "You are Sensei Suki teaching a 10-minute Japanese practice. Build a slightly deeper mini-lesson with kana, romaji, and English, then ask one practice question.";
  }

  return "You are Sensei Suki, a fun Japanese tutor for kids. Keep things friendly, short, and clear with kana, romaji, and English.";
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

    const data = (await openaiResponse.json()) as { output_text?: string };
    return NextResponse.json({ text: data.output_text ?? "Let's keep practicing!" });
  } catch (error) {
    console.error("Unexpected /api/tutor error", error);
    return NextResponse.json({ error: "Unexpected tutor server error." }, { status: 500 });
  }
}
