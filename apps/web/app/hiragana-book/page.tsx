"use client";

import Link from "next/link";
import { useState } from "react";

const MAX_PAGES = 60;

export default function HiraganaBookPage() {
  const [page, setPage] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  function prev() {
    setPage((p) => Math.max(1, p - 1));
  }

  function next() {
    setPage((p) => Math.min(MAX_PAGES, p + 1));
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    if (delta > 45) prev();
    if (delta < -45) next();
    setTouchStartX(null);
  }

  return (
    <main>
      <section className="card" style={{ marginBottom: "0.8rem" }}>
        <h1 className="hero-title" style={{ fontSize: "2rem" }}>Hiragana Book</h1>
        <p>Swipe left or right over the book to change pages.</p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="secondary" onClick={prev} disabled={page <= 1}>Previous</button>
          <button type="button" onClick={next} disabled={page >= MAX_PAGES}>Next</button>
          <span>Page {page}</span>
          <Link href="/" className="secondary" style={{ padding: "0.72rem 1.1rem", borderRadius: 12 }}>
            Back Home
          </Link>
        </div>
      </section>

      <section className="card" style={{ padding: "0.5rem" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <iframe
          title="Tofugu Learn Hiragana Book"
          src={`/hiragana-book.pdf#page=${page}&view=FitH`}
          style={{ width: "100%", height: "76vh", border: 0, borderRadius: 12 }}
        />
      </section>
    </main>
  );
}
