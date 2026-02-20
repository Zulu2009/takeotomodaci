"use client";

import Link from "next/link";
import { useState } from "react";

const MAX_PAGES = 44;

export default function HiraganaBookPage() {
  const [page, setPage] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  function goPrev() {
    setPage((prev) => Math.max(1, prev - 1));
  }

  function goNext() {
    setPage((prev) => Math.min(MAX_PAGES, prev + 1));
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;

    if (delta > 50) goPrev();
    if (delta < -50) goNext();

    setTouchStartX(null);
  }

  return (
    <main>
      <section className="card" style={{ marginBottom: "0.8rem" }}>
        <h1 className="hero-title" style={{ fontSize: "2rem" }}>Hiragana Book</h1>
        <p>Swipe left/right on the PDF area to change pages.</p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="secondary" onClick={goPrev} disabled={page <= 1}>
            Previous
          </button>
          <button type="button" onClick={goNext} disabled={page >= MAX_PAGES}>
            Next
          </button>
          <span>Page {page} / {MAX_PAGES}</span>
          <Link href="/" className="secondary" style={{ padding: "0.72rem 1.1rem", borderRadius: 12 }}>
            Back Home
          </Link>
        </div>
      </section>

      <section
        className="card"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ padding: "0.5rem", overflow: "hidden" }}
      >
        <iframe
          title="Tofugu Hiragana Book"
          src={`/hiragana-book.pdf#page=${page}&view=FitH`}
          style={{ width: "100%", height: "76vh", border: 0, borderRadius: 12 }}
        />
      </section>
    </main>
  );
}
