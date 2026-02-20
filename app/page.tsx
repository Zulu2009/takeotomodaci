"use client";

import { useMemo, useState } from "react";
import { LESSON_PROMPTS, type LessonDay } from "@/lib/lesson-prompts";
import { useLocalProgress } from "@/lib/use-local-progress";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const [selectedDay, setSelectedDay] = useState<LessonDay>(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const {
    knownVocab,
    knownKanji,
    addKnownVocab,
    addKnownKanji,
    resetProgress,
    exportProgressJson
  } = useLocalProgress();

  const lessonPrompt = useMemo(() => LESSON_PROMPTS[selectedDay], [selectedDay]);

  async function onSend() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonDay: selectedDay,
          lessonPrompt,
          knownVocab,
          knownKanji,
          messages: nextMessages
        })
      });

      const data = (await res.json()) as {
        reply?: string;
        extractedVocab?: string[];
        extractedKanji?: string[];
        error?: string;
      };

      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? "Chat request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);

      if (data.extractedVocab?.length) {
        data.extractedVocab.forEach(addKnownVocab);
      }
      if (data.extractedKanji?.length) {
        data.extractedKanji.forEach(addKnownKanji);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issue. Try again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4">
      <header className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold">Japanese Sensei Suki</h1>
        <p className="text-sm text-slate-700">Tutor chat with lesson mode and local progress tracking.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-[320px,1fr]">
        <aside className="space-y-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-semibold">Lesson Day</label>
            <select
              className="w-full rounded-lg border border-slate-300 p-2"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value) as LessonDay)}
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-600">{lessonPrompt}</p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Progress</h2>
            <p className="text-xs text-slate-600">Known vocab: {knownVocab.length}</p>
            <p className="text-xs text-slate-600">Known kanji: {knownKanji.length}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={resetProgress}
                className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700"
              >
                Reset Progress
              </button>
              <button
                onClick={exportProgressJson}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white"
              >
                Export Progress JSON
              </button>
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <div className="h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-600">Start by saying hello or asking for today&apos;s lesson.</p>
            ) : null}
            {messages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}`}
                className={
                  m.role === "assistant"
                    ? "rounded-lg bg-amber-100 p-3 text-sm"
                    : "rounded-lg bg-blue-100 p-3 text-sm"
                }
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide">{m.role}</p>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 p-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type English or Japanese"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
            />
            <button
              onClick={onSend}
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
