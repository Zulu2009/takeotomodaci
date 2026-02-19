"use client";

import { useEffect, useState } from "react";

const VOCAB_KEY = "jss_known_vocab";
const KANJI_KEY = "jss_known_kanji";

function parseStoredList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function useLocalProgress() {
  const [knownVocab, setKnownVocab] = useState<string[]>([]);
  const [knownKanji, setKnownKanji] = useState<string[]>([]);

  useEffect(() => {
    setKnownVocab(parseStoredList(localStorage.getItem(VOCAB_KEY)));
    setKnownKanji(parseStoredList(localStorage.getItem(KANJI_KEY)));
  }, []);

  useEffect(() => {
    localStorage.setItem(VOCAB_KEY, JSON.stringify(knownVocab));
  }, [knownVocab]);

  useEffect(() => {
    localStorage.setItem(KANJI_KEY, JSON.stringify(knownKanji));
  }, [knownKanji]);

  function addUnique(current: string[], value: string): string[] {
    const clean = value.trim();
    if (!clean) return current;
    if (current.includes(clean)) return current;
    return [...current, clean];
  }

  function addKnownVocab(value: string) {
    setKnownVocab((prev) => addUnique(prev, value));
  }

  function addKnownKanji(value: string) {
    setKnownKanji((prev) => addUnique(prev, value));
  }

  function resetProgress() {
    setKnownVocab([]);
    setKnownKanji([]);
  }

  function exportProgressJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      knownVocab,
      knownKanji
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "japanese-progress.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return {
    knownVocab,
    knownKanji,
    addKnownVocab,
    addKnownKanji,
    resetProgress,
    exportProgressJson
  };
}
