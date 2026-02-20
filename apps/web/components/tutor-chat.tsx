"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { initAnalytics } from "@/lib/analytics";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function TutorChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = useMemo(() => {
    return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  }, []);
  const useExternalApi = process.env.NEXT_PUBLIC_USE_EXTERNAL_API === "true" && Boolean(apiBase);
  const chatEndpoint = useExternalApi ? `${apiBase}/api/chat` : "/api/chat";

  useEffect(() => {
    void initAnalytics();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        let detail = "";
        try {
          const errorData = (await response.json()) as { error?: string; detail?: string };
          detail = errorData.error ?? errorData.detail ?? "";
        } catch {
          // keep fallback error below
        }
        throw new Error(detail ? `${response.status} ${detail}` : `Request failed: ${response.status}`);
      }

      const data = (await response.json()) as { answer?: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer ?? "No response." }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error reaching tutor API: ${error instanceof Error ? error.message : "unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2>AI Tutor</h2>
      {useExternalApi ? <p>Using external API route.</p> : <p>Using built-in Vercel API route.</p>}

      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
        {messages.length === 0 ? <p>No messages yet.</p> : null}
        {messages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} className="card" style={{ margin: 0 }}>
            <strong>{msg.role === "assistant" ? "Sensei" : "You"}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about Japanese words, grammar, or pronunciation..."
          style={{
            flex: 1,
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "0.65rem",
            fontSize: "1rem",
          }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
