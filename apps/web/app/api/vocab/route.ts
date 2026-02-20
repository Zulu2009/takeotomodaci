import { NextRequest, NextResponse } from "next/server";

type VocabRequest = {
  terms?: string[];
};

type VocabItem = {
  term: string;
  romaji: string;
  english: string;
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

function extractText(data: OpenAIResponse): string {
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
    return NextResponse.json({ error: "OPENAI_API_KEY is missing on the server." }, { status: 500 });
  }

  let payload: VocabRequest;
  try {
    payload = (await request.json()) as VocabRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const terms = (payload.terms ?? []).map((term) => term.trim()).filter(Boolean).slice(0, 12);
  if (terms.length === 0) {
    return NextResponse.json({ vocab: [] });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
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
            content:
              "Return ONLY valid JSON array. Each item must be {\"term\":\"...\",\"romaji\":\"...\",\"english\":\"...\"}. Keep english short.",
          },
          {
            role: "user",
            content: `Create romaji and english for these Japanese terms: ${terms.join(", ")}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("/api/vocab upstream error", response.status, detail);
      return NextResponse.json({ error: "Vocab provider request failed." }, { status: 502 });
    }

    const data = (await response.json()) as OpenAIResponse;
    const text = extractText(data);

    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end < 0 || end <= start) {
      return NextResponse.json({ vocab: [] });
    }

    const parsed = JSON.parse(text.slice(start, end + 1)) as Array<Partial<VocabItem>>;
    const vocab = parsed
      .map((item) => ({
        term: typeof item.term === "string" ? item.term : "",
        romaji: typeof item.romaji === "string" ? item.romaji : "",
        english: typeof item.english === "string" ? item.english : "",
      }))
      .filter((item) => item.term && item.romaji && item.english);

    return NextResponse.json({ vocab });
  } catch (error) {
    console.error("Unexpected /api/vocab error", error);
    return NextResponse.json({ error: "Unexpected vocab server error." }, { status: 500 });
  }
}
