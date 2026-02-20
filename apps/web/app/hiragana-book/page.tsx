"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export default function HiraganaBookPage() {
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [renderWidth, setRenderWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const maxPages = numPages ?? 60;

  useEffect(() => {
    const update = () => {
      const width = containerRef.current?.clientWidth ?? 700;
      setRenderWidth(Math.max(280, Math.floor(width - 16)));
    };

    update();

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  function prev() {
    setPage((p) => Math.max(1, p - 1));
  }

  function next() {
    setPage((p) => Math.min(maxPages, p + 1));
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

  const pdfLink = useMemo(() => `/hiragana-book.pdf#page=${page}&view=FitH`, [page]);

  return (
    <main>
      <section className="card" style={{ marginBottom: "0.8rem" }}>
        <h1 className="hero-title" style={{ fontSize: "2rem" }}>Hiragana Book</h1>
        <p>Swipe left or right on the page to move. Buttons work too.</p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="secondary" onClick={prev} disabled={page <= 1}>Previous</button>
          <button type="button" onClick={next} disabled={page >= maxPages}>Next</button>
          <span>Page {page} / {maxPages}</span>
          <a
            href={pdfLink}
            target="_blank"
            rel="noreferrer"
            className="secondary"
            style={{ padding: "0.72rem 1.1rem", borderRadius: 12 }}
          >
            Open Full Screen
          </a>
          <Link href="/" className="secondary" style={{ padding: "0.72rem 1.1rem", borderRadius: 12 }}>
            Back Home
          </Link>
        </div>
      </section>

      <section
        ref={containerRef}
        className="card"
        style={{ padding: "0.5rem", display: "flex", justifyContent: "center", minHeight: "76vh" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Document
          file="/hiragana-book.pdf"
          onLoadSuccess={(info) => {
            setNumPages(info.numPages);
            setPage((p) => Math.min(p, info.numPages));
          }}
          loading={<p>Loading book...</p>}
          error={<p>Could not load PDF in-app. Use Open Full Screen.</p>}
        >
          <Page pageNumber={page} width={renderWidth} renderAnnotationLayer={false} renderTextLayer={false} />
        </Document>
      </section>
    </main>
  );
}
