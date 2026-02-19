import type { ChatRequest, Env } from "./types";
import games from "./seed/games.json";
import lessons from "./seed/lessons.json";
import videos from "./seed/videos.json";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
  });
}

function getKeyForType(type: string): string | null {
  if (type === "lessons") return "seed/lessons.json";
  if (type === "games") return "seed/games.json";
  if (type === "videos") return "seed/videos.json";
  return null;
}

function getBundledContent(type: string): unknown {
  if (type === "lessons") return lessons;
  if (type === "games") return games;
  if (type === "videos") return videos;
  return null;
}

async function handleChat(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json()) as ChatRequest;

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return json({ error: "messages array is required" }, 400);
  }

  const lastMessage = payload.messages[payload.messages.length - 1]?.content ?? "";

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are Sensei Suki, a concise Japanese tutor. Teach with kana, romaji, and English. Keep explanations short and ask one practice question.",
        },
        {
          role: "user",
          content: lastMessage,
        },
      ],
    }),
  });

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    return json({ error: "OpenAI request failed", detail: errorText }, 502);
  }

  const response = (await openaiResponse.json()) as { output_text?: string };

  return json({
    answer: response.output_text ?? "",
    lessonId: payload.lessonId ?? null,
  });
}

async function handleContent(type: string, env: Env): Promise<Response> {
  const key = getKeyForType(type);
  if (!key) return json({ error: "unknown content type" }, 404);

  if (env.CONTENT_BUCKET) {
    const object = await env.CONTENT_BUCKET.get(key);
    if (!object) return json({ error: `${type} not found in R2` }, 404);

    const text = await object.text();
    return new Response(text, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });
  }

  const bundled = getBundledContent(type);
  if (!bundled) return json({ error: `${type} not found` }, 404);
  return new Response(JSON.stringify(bundled), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type,authorization",
        },
      });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "sensei-suki-api" });
    }

    if (req.method === "POST" && url.pathname === "/api/chat") {
      return handleChat(req, env);
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/content/")) {
      const type = url.pathname.replace("/api/content/", "");
      return handleContent(type, env);
    }

    return json({ error: "not found" }, 404);
  },
};
