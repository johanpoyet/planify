"use client";

import Link from "next/link";
import PollCreator from "@/components/PollCreator";

export default function NewPollPage() {
  return (
    <div style={{ background: "var(--pf-bg)", minHeight: "100vh", color: "var(--pf-text)" }}>

      {/* ── Mobile header ───────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-5 pt-6 pb-2">
        <Link
          href="/polls"
          aria-label="Retour"
          className="flex items-center justify-center rounded-xl"
          style={{ width: 36, height: 36, background: "var(--pf-surface)", border: "1px solid var(--pf-border)", color: "var(--pf-text-dim)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Link>
        <h1 className="font-semibold" style={{ fontSize: 17 }}>Nouveau sondage</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Desktop topbar ──────────────────────────────────────────────── */}
      <div
        className="hidden md:flex sticky top-0 z-10 items-center px-8"
        style={{ height: 56, borderBottom: "1px solid var(--pf-border)", background: "var(--pf-bg)", gap: 8, fontSize: 14 }}
      >
        <Link href="/polls" style={{ color: "var(--pf-text-dim)" }}>Sondages</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--pf-text-muted)" }}>
          <path d="m9 5 7 7-7 7"/>
        </svg>
        <span className="font-semibold" style={{ color: "var(--pf-text)" }}>Nouveau sondage</span>
      </div>

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-28 md:pb-12">
        <PollCreator />
      </div>
    </div>
  );
}
