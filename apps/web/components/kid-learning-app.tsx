"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { initAnalytics } from "@/lib/analytics";

type Mode = "fun-chat" | "training-5" | "training-10";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MODE_LABELS: Record<Mode, string> = {
  "fun-chat": "Start Fun Chat",
  "training-5": "Training (5 min)",
  "training-10": "Training (10 min)",
};

export function KidLearningApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [autoLoginTried, setAutoLoginTried] = useState(false);

  const [mode, setMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [pinInput, setPinInput] = useState("");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [showParentSettings, setShowParentSettings] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const parentPin = useMemo(() => process.env.NEXT_PUBLIC_PARENT_PIN ?? "2468", []);

  useEffect(() => {
    void initAnalytics();

    const bootstrap = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Failed to set auth persistence", error);
      }

      const unsub = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setAuthLoading(false);
      });

      return unsub;
    };

    let unsubscribe: (() => void) | null = null;
    bootstrap().then((unsub) => {
      unsubscribe = unsub ?? null;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (authLoading || user || autoLoginTried) return;
    setAutoLoginTried(true);

    void (async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auto anonymous sign-in failed", error);
      }
    })();
  }, [authLoading, user, autoLoginTried]);

  async function handleLogin() {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
      setToast("Oops — try again");
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      setMode(null);
      setMessages([]);
      setPinInput("");
      setPinUnlocked(false);
      setShowParentSettings(false);
    } catch (error) {
      console.error("Logout failed", error);
      setToast("Oops — try again");
    }
  }

  function openMode(nextMode: Mode) {
    setMode(nextMode);
    setMessages([]);
  }

  function verifyPin() {
    if (pinInput === parentPin) {
      setPinUnlocked(true);
      return;
    }
    setToast("Oops — try again");
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !mode || !user || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed, mode, userId: user.uid }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        console.error("Tutor request failed", response.status, errorData.error);
        throw new Error(errorData.error ?? "Tutor request failed");
      }

      const data = (await response.json()) as { text?: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.text ?? "Let's try again." }]);
    } catch (error) {
      console.error("Tutor request error", error);
      setToast("Oops — try again");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main>
        <section className="card">
          <h1>Sensei Suki</h1>
          <p>Loading...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1>Sensei Suki</h1>
          <p>{autoLoginTried ? "Tap below to start learning." : "Signing in..."}</p>
          <button type="button" onClick={handleLogin} style={{ width: "100%", padding: "1rem" }}>
            Login
          </button>
        </section>
      </main>
    );
  }

  const inHome = mode === null;

  return (
    <main>
      <header className="card" style={{ marginBottom: "1rem" }}>
        <h1>Sensei Suki</h1>
        <p>Welcome back.</p>
      </header>

      {inHome ? (
        <section className="card" style={{ display: "grid", gap: "0.85rem", maxWidth: 700 }}>
          <button type="button" onClick={() => openMode("fun-chat")} style={{ fontSize: "1.45rem", padding: "1.1rem" }}>
            Start Fun Chat
          </button>
          <button
            type="button"
            onClick={() => openMode("training-5")}
            style={{ fontSize: "1.45rem", padding: "1.1rem" }}
          >
            Training (5 min)
          </button>
          <button
            type="button"
            onClick={() => openMode("training-10")}
            style={{ fontSize: "1.45rem", padding: "1.1rem" }}
          >
            Training (10 min)
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() => setShowParentSettings((prev) => !prev)}
            style={{ marginTop: "0.5rem" }}
          >
            Parent settings
          </button>

          {showParentSettings ? (
            <div className="card" style={{ margin: 0 }}>
              <h3>Parent settings</h3>
              <p>Enter PIN to unlock logout.</p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  value={pinInput}
                  onChange={(event) => setPinInput(event.target.value)}
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN"
                  style={{
                    flex: 1,
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "0.65rem",
                    fontSize: "1rem",
                  }}
                />
                <button type="button" className="secondary" onClick={verifyPin}>
                  Unlock
                </button>
              </div>

              {pinUnlocked ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="card" style={{ maxWidth: 780 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ margin: 0 }}>{MODE_LABELS[mode]}</h2>
            <button type="button" className="secondary" onClick={() => setMode(null)}>
              Back Home
            </button>
          </div>

          <div style={{ display: "grid", gap: "0.5rem", margin: "1rem 0" }}>
            {messages.length === 0 ? <p>Ask your first question.</p> : null}
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className="card" style={{ margin: 0 }}>
                <strong>{msg.role === "assistant" ? "Sensei" : "You"}:</strong> {msg.content}
              </div>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: "0.5rem" }}>
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
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </form>
        </section>
      )}

      {toast ? (
        <div
          role="status"
          style={{
            position: "fixed",
            right: "1rem",
            bottom: "1rem",
            background: "#1a1a1a",
            color: "#fff",
            padding: "0.75rem 1rem",
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          {toast}
        </div>
      ) : null}
    </main>
  );
}
