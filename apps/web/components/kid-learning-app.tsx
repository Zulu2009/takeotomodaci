"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

type Mode = "fun-chat" | "training-5" | "training-10" | "kana-match";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type WordEntry = {
  term: string;
  romaji: string;
  english: string;
  count: number;
  lastSeen: string;
  nextReviewAt: string;
};

type ProgressState = {
  xp: number;
  totalSessions: number;
  dailyDate: string;
  dailyXp: number;
  dailySessions: number;
  words: WordEntry[];
};

type TutorVocabItem = {
  term: string;
  romaji: string;
  english: string;
};

type KanaItem = {
  kana: string;
  romaji: string;
};

type KanaRound = {
  kana: string;
  options: string[];
  answer: string;
};

type FunCard = {
  kind: "Trivia" | "Fact" | "Dad Joke";
  text: string;
};

type TeenTriviaCard = {
  title: string;
  text: string;
};

const MODE_LABELS: Record<Mode, string> = {
  "fun-chat": "Start Fun Chat",
  "training-5": "Training (5 min)",
  "training-10": "Training (10 min)",
  "kana-match": "Kana Match Game",
};

const MODE_STARTERS: Record<Mode, string> = {
  "fun-chat":
    "Konnichiwa! We can talk about anything: friends, school, shopping, music, news, and more. I will teach Japanese naturally as we talk.",
  "training-5":
    "Welcome to 5-minute training. I will run quick practice rounds and then a mini challenge.",
  "training-10":
    "Welcome to 10-minute training. I will teach a deeper mini lesson, then quiz your recall.",
  "kana-match": "Kana Match time. Tap the correct romaji for each kana card.",
};

const KANA_ITEMS: KanaItem[] = [
  { kana: "あ", romaji: "a" },
  { kana: "い", romaji: "i" },
  { kana: "う", romaji: "u" },
  { kana: "え", romaji: "e" },
  { kana: "お", romaji: "o" },
  { kana: "か", romaji: "ka" },
  { kana: "き", romaji: "ki" },
  { kana: "く", romaji: "ku" },
  { kana: "け", romaji: "ke" },
  { kana: "こ", romaji: "ko" },
  { kana: "さ", romaji: "sa" },
  { kana: "し", romaji: "shi" },
];

const FUN_CARDS: FunCard[] = [
  { kind: "Trivia", text: "In Japanese, there are multiple words for 'I' like watashi, boku, and ore depending on context." },
  { kind: "Fact", text: "The Japanese school year usually starts in April, right when cherry blossoms begin to bloom." },
  { kind: "Dad Joke", text: "Why did the kanji student bring a ladder? To reach a higher level." },
  { kind: "Trivia", text: "Arigato can feel casual, while arigato gozaimasu is more polite and formal." },
  { kind: "Fact", text: "Many Japanese convenience stores are famous for fresh meals, not just snacks." },
  { kind: "Dad Joke", text: "I opened a sushi gym. It has great rolls." },
  { kind: "Trivia", text: "Hiragana is often used for grammar and native words, while katakana is used for many foreign loanwords." },
  { kind: "Fact", text: "You can often hear train departure melodies in Japan, and stations may have their own tune." },
  { kind: "Dad Joke", text: "My Japanese vocabulary is like tempura: still in batter shape, but getting crisp." },
  { kind: "Dad Joke", text: "I told my friend I mastered katakana. He said, 'Sounds like a bold character arc.'" },
  { kind: "Dad Joke", text: "Why did the ramen chef study grammar? Better noodle clauses." },
];

const TEEN_TRIVIA_CARDS: TeenTriviaCard[] = [
  {
    title: "History Spotlight",
    text: "During the Meiji era (starting in 1868), Japan rapidly modernized its schools, military, and industry in just a few decades.",
  },
  {
    title: "Culture Today",
    text: "Japanese convenience stores are part of everyday life and often sell fresh meals, bill-pay services, and event tickets.",
  },
  {
    title: "History Spotlight",
    text: "The Heian period shaped much of classical Japanese literature, including The Tale of Genji by Murasaki Shikibu.",
  },
  {
    title: "Culture Today",
    text: "Many Japanese cities balance old and new: historic shrines can sit only minutes away from high-tech shopping districts.",
  },
  {
    title: "History Spotlight",
    text: "After World War II, Japan rebuilt quickly and became a major global economy by focusing on manufacturing and technology.",
  },
];

const EMPTY_PROGRESS: ProgressState = {
  xp: 0,
  totalSessions: 0,
  dailyDate: "",
  dailyXp: 0,
  dailySessions: 0,
  words: [],
};

const XP_PER_LEVEL = 120;

function isoDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function withDailyReset(progress: ProgressState): ProgressState {
  const today = isoDateOnly(new Date());
  if (progress.dailyDate === today) return progress;
  return {
    ...progress,
    dailyDate: today,
    dailyXp: 0,
    dailySessions: 0,
  };
}

function parseStoredProgress(value: string | null): ProgressState {
  if (!value) return withDailyReset(EMPTY_PROGRESS);

  try {
    const parsed = JSON.parse(value) as Partial<ProgressState>;
    return withDailyReset({
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      totalSessions: typeof parsed.totalSessions === "number" ? parsed.totalSessions : 0,
      dailyDate: typeof parsed.dailyDate === "string" ? parsed.dailyDate : "",
      dailyXp: typeof parsed.dailyXp === "number" ? parsed.dailyXp : 0,
      dailySessions: typeof parsed.dailySessions === "number" ? parsed.dailySessions : 0,
      words: Array.isArray(parsed.words)
        ? parsed.words
            .map((word) => ({
              term: typeof word.term === "string" ? word.term : "",
              romaji: typeof word.romaji === "string" ? word.romaji : "",
              english: typeof word.english === "string" ? word.english : "",
              count: typeof word.count === "number" ? word.count : 1,
              lastSeen: typeof word.lastSeen === "string" ? word.lastSeen : new Date().toISOString(),
              nextReviewAt: typeof word.nextReviewAt === "string" ? word.nextReviewAt : new Date().toISOString(),
            }))
            .filter((word) => word.term.length > 0)
        : [],
    });
  } catch {
    return withDailyReset(EMPTY_PROGRESS);
  }
}

function extractJapaneseTerms(text: string): string[] {
  const matches = text.match(/[\u3040-\u30ff\u4e00-\u9faf]{2,}/g) ?? [];
  return [...new Set(matches)].slice(0, 5);
}

function normalizeJapaneseTerm(term: string): string {
  return term.replace(/[^\u3040-\u30ff\u4e00-\u9fafー]/g, "");
}

function findBestVocabMatch(term: string, vocab: TutorVocabItem[]): TutorVocabItem | undefined {
  const normalizedTerm = normalizeJapaneseTerm(term);
  if (!normalizedTerm) return undefined;

  const direct = vocab.find((item) => normalizeJapaneseTerm(item.term) === normalizedTerm);
  if (direct) return direct;

  return vocab.find((item) => {
    const normalizedItem = normalizeJapaneseTerm(item.term);
    return normalizedItem.includes(normalizedTerm) || normalizedTerm.includes(normalizedItem);
  });
}

function pickReviewQueue(words: WordEntry[]): WordEntry[] {
  if (words.length === 0) return [];
  const now = Date.now();
  const due = words.filter((word) => new Date(word.nextReviewAt).getTime() <= now);
  const pool = due.length > 0 ? due : [...words].sort((a, b) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime());
  return pool.slice(0, 3);
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function createKanaRound(): KanaRound {
  const item = KANA_ITEMS[Math.floor(Math.random() * KANA_ITEMS.length)];
  const distractors = shuffle(
    KANA_ITEMS.filter((entry) => entry.romaji !== item.romaji).map((entry) => entry.romaji),
  ).slice(0, 3);

  return {
    kana: item.kana,
    answer: item.romaji,
    options: shuffle([item.romaji, ...distractors]),
  };
}

function pickRandomJokeCard(): FunCard {
  const jokes = FUN_CARDS.filter((card) => card.kind === "Dad Joke");
  return jokes[Math.floor(Math.random() * jokes.length)] ?? FUN_CARDS[0];
}

function pickTeenTriviaCard(): TeenTriviaCard {
  return TEEN_TRIVIA_CARDS[Math.floor(Math.random() * TEEN_TRIVIA_CARDS.length)] ?? TEEN_TRIVIA_CARDS[0];
}

export function KidLearningApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [autoLoginTried, setAutoLoginTried] = useState(false);

  const [mode, setMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewPreparing, setReviewPreparing] = useState(false);
  const [kanaRound, setKanaRound] = useState<KanaRound | null>(null);
  const [kanaRoundIndex, setKanaRoundIndex] = useState(0);
  const [kanaScore, setKanaScore] = useState(0);

  const [progress, setProgress] = useState<ProgressState>(withDailyReset(EMPTY_PROGRESS));
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [reviewQueue, setReviewQueue] = useState<WordEntry[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const [pinInput, setPinInput] = useState("");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [showParentSettings, setShowParentSettings] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [refreshJoke] = useState<FunCard>(() => pickRandomJokeCard());
  const [refreshTrivia] = useState<TeenTriviaCard>(() => pickTeenTriviaCard());

  const parentPin = useMemo(() => process.env.NEXT_PUBLIC_PARENT_PIN ?? "2468", []);
  const level = Math.floor(progress.xp / XP_PER_LEVEL) + 1;
  const levelFloor = (level - 1) * XP_PER_LEVEL;
  const nextLevelTarget = level * XP_PER_LEVEL;
  const levelPercent = Math.min(100, Math.round(((progress.xp - levelFloor) / XP_PER_LEVEL) * 100));

  const reviewActive = pendingMode !== null;
  const reviewWord = reviewQueue[reviewIndex] ?? null;
  const dueCount = progress.words.filter((word) => new Date(word.nextReviewAt).getTime() <= Date.now()).length;
  const activeMode: Mode = mode ?? "fun-chat";

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

  useEffect(() => {
    if (!user) return;
    const key = `sensei-suki-progress:${user.uid}`;
    setProgress(parseStoredProgress(window.localStorage.getItem(key)));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const key = `sensei-suki-progress:${user.uid}`;
    window.localStorage.setItem(key, JSON.stringify(withDailyReset(progress)));
  }, [progress, user]);

  function awardXp(amount: number) {
    setProgress((prev) => {
      const next = withDailyReset(prev);
      return {
        ...next,
        xp: next.xp + amount,
        dailyXp: next.dailyXp + amount,
      };
    });
  }

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
      setKanaRound(null);
      setKanaRoundIndex(0);
      setKanaScore(0);
      setPendingMode(null);
      setReviewQueue([]);
      setReviewIndex(0);
      setPinInput("");
      setPinUnlocked(false);
      setShowParentSettings(false);
    } catch (error) {
      console.error("Logout failed", error);
      setToast("Oops — try again");
    }
  }

  function beginMode(nextMode: Mode) {
    setMode(nextMode);
    if (nextMode === "kana-match") {
      setKanaRound(createKanaRound());
      setKanaRoundIndex(0);
      setKanaScore(0);
      setMessages([]);
      return;
    }

    setMessages([{ role: "assistant", content: MODE_STARTERS[nextMode] }]);
  }

  async function enrichMissingWordMetadata(base: ProgressState): Promise<ProgressState> {
    const missingTerms = base.words
      .filter((word) => !word.romaji || !word.english)
      .map((word) => word.term)
      .slice(0, 12);

    if (missingTerms.length === 0) return base;

    try {
      const response = await fetch("/api/vocab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ terms: missingTerms }),
      });

      if (!response.ok) return base;
      const data = (await response.json()) as { vocab?: TutorVocabItem[] };
      const vocab = Array.isArray(data.vocab) ? data.vocab : [];
      if (vocab.length === 0) return base;

      const next = {
        ...base,
        words: base.words.map((word) => {
          const found = findBestVocabMatch(word.term, vocab);
          if (!found) return word;
          return {
            ...word,
            romaji: word.romaji || found.romaji,
            english: word.english || found.english,
          };
        }),
      };
      setProgress(next);
      return next;
    } catch (error) {
      console.error("Failed to enrich word metadata", error);
      return base;
    }
  }

  async function openMode(nextMode: Mode) {
    setReviewPreparing(true);
    let working = withDailyReset(progress);
    working = await enrichMissingWordMetadata(working);
    const queue = pickReviewQueue(working.words);
    if (queue.length > 0) {
      setPendingMode(nextMode);
      setReviewQueue(queue);
      setReviewIndex(0);
      setReviewPreparing(false);
      return;
    }

    setProgress((prev) => {
      const next = withDailyReset(prev);
      return {
        ...next,
        totalSessions: next.totalSessions + 1,
        dailySessions: next.dailySessions + 1,
      };
    });
    beginMode(nextMode);
    setReviewPreparing(false);
  }

  function finishReviewStep(correct: boolean) {
    if (!reviewWord || !pendingMode) return;

    const now = new Date();
    const nextReview = new Date(now.getTime() + (correct ? 3 : 1) * 24 * 60 * 60 * 1000).toISOString();

    setProgress((prev) => {
      const next = withDailyReset(prev);
      return {
        ...next,
        words: next.words.map((word) =>
          word.term === reviewWord.term
            ? {
                ...word,
                lastSeen: now.toISOString(),
                nextReviewAt: nextReview,
              }
            : word,
        ),
      };
    });

    awardXp(correct ? 8 : 3);

    if (reviewIndex + 1 < reviewQueue.length) {
      setReviewIndex((prev) => prev + 1);
      return;
    }

    setProgress((prev) => {
      const next = withDailyReset(prev);
      return {
        ...next,
        totalSessions: next.totalSessions + 1,
        dailySessions: next.dailySessions + 1,
      };
    });

    const nextMode = pendingMode;
    setPendingMode(null);
    setReviewQueue([]);
    setReviewIndex(0);
    beginMode(nextMode);
  }

  function verifyPin() {
    if (pinInput === parentPin) {
      setPinUnlocked(true);
      return;
    }
    setToast("Oops — try again");
  }

  function handleKanaAnswer(selected: string) {
    if (!kanaRound) return;
    const isCorrect = selected === kanaRound.answer;
    if (isCorrect) {
      setKanaScore((prev) => prev + 1);
      awardXp(10);
    } else {
      awardXp(3);
    }

    if (kanaRoundIndex >= 4) {
      setToast(isCorrect ? "Nice! Game complete." : "Good effort! Game complete.");
      setMode(null);
      setKanaRound(null);
      return;
    }

    setKanaRoundIndex((prev) => prev + 1);
    setKanaRound(createKanaRound());
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

      const data = (await response.json()) as { text?: string; vocab?: TutorVocabItem[] };
      const reply = data.text ?? "Let's try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      const nowIso = new Date().toISOString();
      const vocabItems = Array.isArray(data.vocab) ? data.vocab : [];
      const terms = extractJapaneseTerms(reply);
      setProgress((prev) => {
        const next = withDailyReset(prev);
        const wordsMap = new Map(next.words.map((word) => [word.term, word]));

        for (const term of terms) {
          const match = findBestVocabMatch(term, vocabItems);
          const existing = wordsMap.get(term);
          if (existing) {
            wordsMap.set(term, {
              ...existing,
              romaji: match?.romaji || existing.romaji,
              english: match?.english || existing.english,
              count: existing.count + 1,
              lastSeen: nowIso,
            });
          } else {
            wordsMap.set(term, {
              term,
              romaji: match?.romaji ?? "",
              english: match?.english ?? "",
              count: 1,
              lastSeen: nowIso,
              nextReviewAt: nowIso,
            });
          }
        }

        return {
          ...next,
          words: Array.from(wordsMap.values()).slice(0, 120),
        };
      });

      awardXp(12);
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

  const inHome = mode === null && !reviewActive;

  return (
    <main>
      <header className="card" style={{ marginBottom: "1rem" }}>
        <h1 className="hero-title">Sensei Suki</h1>
        <p>Talk about anything: friends, school, shopping, music, news, and more.</p>
        <div className="fun-box">
          <p style={{ margin: 0 }}>{refreshJoke.text}</p>
        </div>
        <div className="fun-box" style={{ marginTop: "0.55rem" }}>
          <p style={{ margin: 0 }}>{refreshTrivia.title}: {refreshTrivia.text}</p>
        </div>
        <div className="xp-wrap">
          <div>
            <strong>Level {level}</strong>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.9rem" }}>
              Today: {progress.dailyXp} XP, {progress.dailySessions} sessions
            </p>
          </div>
          <div className="xp-meter">
            <div className="xp-fill" style={{ width: `${levelPercent}%` }} />
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem" }}>{progress.xp} / {nextLevelTarget} XP</p>
        </div>
      </header>

      {inHome ? (
        <section className="card" style={{ display: "grid", gap: "0.85rem", maxWidth: 760 }}>
          <button type="button" onClick={() => void openMode("fun-chat")} className="mode-button">
            <span>Start Fun Chat</span>
            <span>→</span>
          </button>
          <button type="button" onClick={() => void openMode("training-5")} className="mode-button">
            <span>Training (5 min)</span>
            <span>→</span>
          </button>
          <button type="button" onClick={() => void openMode("training-10")} className="mode-button">
            <span>Training (10 min)</span>
            <span>→</span>
          </button>
          <button type="button" onClick={() => void openMode("kana-match")} className="mode-button">
            <span>Kana Match</span>
            <span>→</span>
          </button>
          <Link href="/hiragana-book" className="mode-button">
            <span>Hiragana Book (Swipe)</span>
            <span>→</span>
          </Link>
          {reviewPreparing ? <p>Preparing quick review...</p> : null}

          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ marginTop: 0 }}>Word Bank</h3>
            <p style={{ marginTop: 0 }}>
              {progress.words.length} words saved. {dueCount} ready to review.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {progress.words.slice(0, 12).map((word) => (
                <div key={word.term} className="card" style={{ margin: 0, padding: "0.45rem 0.6rem" }}>
                  <strong>{word.term}</strong>
                  <p style={{ margin: 0, fontSize: "0.78rem" }}>{word.romaji || "..."}</p>
                  <p style={{ margin: 0, fontSize: "0.78rem" }}>{word.english || "..."}</p>
                </div>
              ))}
              {progress.words.length === 0 ? <span>No words yet. Start chatting.</span> : null}
            </div>
          </div>

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
      ) : reviewActive && reviewWord ? (
        <section className="card" style={{ maxWidth: 700 }}>
          <h2 style={{ marginTop: 0 }}>Quick Review</h2>
          <p>
            Before each new session, review a few words. Card {reviewIndex + 1} of {reviewQueue.length}
          </p>
          <div className="card" style={{ margin: "0.6rem 0", textAlign: "center" }}>
            <p style={{ marginBottom: "0.2rem" }}>Word</p>
            <h2 style={{ margin: 0, fontSize: "2rem" }}>{reviewWord.term}</h2>
            <p style={{ margin: "0.3rem 0 0", fontSize: "1rem" }}>{reviewWord.romaji || "..."}</p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.95rem" }}>{reviewWord.english || "..."}</p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="button" className="secondary" onClick={() => finishReviewStep(false)}>
              Again
            </button>
            <button type="button" onClick={() => finishReviewStep(true)}>
              Got it
            </button>
          </div>
        </section>
      ) : mode === "kana-match" && kanaRound ? (
        <section className="card" style={{ maxWidth: 780 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ margin: 0 }}>Kana Match</h2>
            <button type="button" className="secondary" onClick={() => setMode(null)}>
              Back Home
            </button>
          </div>
          <p style={{ marginBottom: "0.3rem" }}>
            Round {kanaRoundIndex + 1}/5 • Score {kanaScore}
          </p>
          <div className="card" style={{ margin: "0.7rem 0", textAlign: "center" }}>
            <p style={{ margin: "0 0 0.35rem" }}>Match this kana:</p>
            <h2 style={{ fontSize: "3rem", margin: 0 }}>{kanaRound.kana}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: "0.6rem" }}>
            {kanaRound.options.map((option) => (
              <button key={option} type="button" onClick={() => handleKanaAnswer(option)} className="secondary">
                {option}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="card" style={{ maxWidth: 780 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ margin: 0 }}>{MODE_LABELS[activeMode]}</h2>
            <button type="button" className="secondary" onClick={() => setMode(null)}>
              Back Home
            </button>
          </div>

          <div style={{ display: "grid", gap: "0.5rem", margin: "1rem 0" }}>
            {messages.length === 0 ? <p>Ask your first question.</p> : null}
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`bubble ${msg.role === "user" ? "you" : ""}`}>
                <strong>{msg.role === "assistant" ? "Sensei" : "You"}:</strong> {msg.content}
              </div>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about Japanese words, grammar, shopping, music, school, anything..."
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
