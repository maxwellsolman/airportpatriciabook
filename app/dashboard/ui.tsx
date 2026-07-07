"use client";

import { useEffect, useRef, useState } from "react";
import type { Metrics } from "@/lib/metrics";

export const PRICE = 9.99; // per PDF; used only for the pre-Stripe fallback estimate

/* ---------- date helpers ---------- */
export const ymd = (d: Date) => d.toISOString().slice(0, 10);
export function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
export const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  { key: "today", label: "Today", range: () => [ymd(new Date()), ymd(new Date())] },
  { key: "7d", label: "7 days", range: () => [ymd(daysAgo(6)), ymd(new Date())] },
  { key: "30d", label: "30 days", range: () => [ymd(daysAgo(29)), ymd(new Date())] },
  { key: "90d", label: "90 days", range: () => [ymd(daysAgo(89)), ymd(new Date())] },
  { key: "all", label: "All", range: () => [ymd(daysAgo(365)), ymd(new Date())] },
];
export function rangeFor(preset: string): [string, string] {
  return (PRESETS.find((p) => p.key === preset) || PRESETS[0]).range();
}
export function presetLabel(preset: string): string {
  return (PRESETS.find((p) => p.key === preset) || PRESETS[0]).label;
}

/* ---------- format ---------- */
export const fmt = (n: number) => Math.round(n).toLocaleString();
export const money = (n: number) =>
  (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 && n > 0 ? 1 : 0)}%`;
export function dur(s: number) {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
}
// Short relative time, e.g. "3m ago", "5h ago". Full timestamp goes in the title attr.
export function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return `${Math.floor(d / 604800)}w ago`;
}
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/* ---------- icons (no emoji) ---------- */
export const I = {
  overview: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  funnel: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 4h18l-7 8v7l-4 2v-9L3 4z" /></svg>),
  traffic: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 19V10M10 19V5M16 19v-6M22 19V8" /></svg>),
  behavior: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  card: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></svg>),
  external: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></svg>),
  logout: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>),
  check: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5" /></svg>),
  alert: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>),
  info: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>),
  brand: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12h4l2-7 4 18 2-9h6" /></svg>),
  chevron: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6" /></svg>),
  arrow: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  download: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>),
  search: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>),
};

/* ---------- animated number ---------- */
export function CountUp({ value, render }: { value: number; render: (n: number) => string }) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    const from = ref.current;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 850);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setV(value);
        ref.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="dash-num">{render(v)}</span>;
}

/* ---------- horizontal bars ---------- */
export function Bars({ rows, max, mono = true, money: asMoney = false }: { rows: { label: string; value: number }[]; max: number; mono?: boolean; money?: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 60);
    return () => {
      setOn(false);
      clearTimeout(t);
    };
  }, [rows]);
  if (!rows.length) return <div style={{ color: "var(--d-faint)", fontSize: "0.85rem", padding: "0.3rem 0" }}>No data in this range yet.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 5 }}>
            <span style={{ color: "var(--d-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>{r.label}</span>
            <b className={mono ? "dash-num" : ""} style={{ color: "var(--d-ink)", fontWeight: 600 }}>{asMoney ? money(r.value) : fmt(r.value)}</b>
          </div>
          <div className="dash-track">
            <div className="dash-fill" style={{ width: on && max ? `${Math.max(3, (r.value / max) * 100)}%` : "0%", transitionDelay: `${i * 55}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- stat card ---------- */
export function Stat({ label, value, hint, accent, loading }: { label: string; value: React.ReactNode; hint?: string; accent?: boolean; loading?: boolean }) {
  return (
    <div className="dash-card dash-stat d-rise">
      <div className="dash-label">{label}</div>
      {loading ? <div className="dash-skel" style={{ height: 30, width: "70%", marginTop: 9 }} /> : <span className={`v${accent ? " accent" : ""}`}>{value}</span>}
      <div className="h">{hint || " "}</div>
    </div>
  );
}

/* ---------- visitors-over-time bar chart ---------- */
export function buildTrend(data: Metrics | null, from: string, to: string): { rows: { label: string; visitors: number }[]; max: number; unit: "hour" | "day" | "week" } {
  let rows: { label: string; visitors: number }[] = [];
  let unit: "hour" | "day" | "week" = "day";
  if (data?.trendUnit === "hour") {
    unit = "hour";
    const byHour = new Map(data.trend.map((t) => [Number(t.day), t.visitors]));
    rows = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, "0")}:00`, visitors: byHour.get(h) ?? 0 }));
  } else {
    const byDay = new Map((data?.trend ?? []).map((t) => [t.day, t.visitors]));
    const cur = new Date(from + "T00:00:00Z");
    const end = new Date(to + "T00:00:00Z");
    let g = 0;
    while (cur <= end && g < 400) {
      const k = ymd(cur);
      rows.push({ label: k, visitors: byDay.get(k) ?? 0 });
      cur.setUTCDate(cur.getUTCDate() + 1);
      g++;
    }
    // Too many daily bars to read — roll up into weeks (keeps big ranges legible).
    if (rows.length > 100) {
      unit = "week";
      const weekly: { label: string; visitors: number }[] = [];
      for (let i = 0; i < rows.length; i += 7) {
        const chunk = rows.slice(i, i + 7);
        weekly.push({ label: chunk[0].label, visitors: chunk.reduce((s, r) => s + r.visitors, 0) });
      }
      rows = weekly;
    }
  }
  return { rows, max: Math.max(...rows.map((t) => t.visitors), 1), unit };
}

export function TrendChart({ rows, max }: { rows: { label: string; visitors: number }[]; max: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: rows.length > 30 ? 2 : 5, height: 140, marginTop: "1.1rem" }}>
      {rows.map((t, i) => (
        <div key={i} title={`${t.label}: ${t.visitors} visitor${t.visitors === 1 ? "" : "s"}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
          <div className="dash-fill" style={{ height: `${t.visitors ? Math.max(5, (t.visitors / max) * 100) : 2}%`, borderRadius: "4px 4px 0 0", background: t.visitors ? "linear-gradient(180deg,var(--d-accent-2),var(--d-accent))" : "#efece4", transitionDelay: `${i * 18}ms`, width: "100%" }} />
        </div>
      ))}
    </div>
  );
}

/* ---------- takeaways ---------- */
export type Take = { tone: "good" | "warn" | "info"; title: string; body: string };
export function buildTakeaways(d: Metrics | null): Take[] {
  if (!d || d.visitors === 0) {
    return [{ tone: "info", title: "No traffic yet", body: "Share your first post or ad to start collecting data. Real visits show up here within about a minute." }];
  }
  const out: Take[] = [];
  if (d.visitors < 30) out.push({ tone: "info", title: "Early data", body: `Only ${fmt(d.visitors)} visitors so far. Treat these as directional until you've got a few hundred.` });
  if (d.checkoutClicks === 0) {
    out.push({ tone: "warn", title: "Nobody's clicking buy", body: `${fmt(d.visitors)} visitors and zero buy-button clicks. The hook or offer up top isn't landing. Lead with a punchier headline and pull the price and CTA higher.` });
  } else if (d.clickRate < 0.12) {
    out.push({ tone: "warn", title: "Low buy-button click rate", body: `Only ${pct(d.clickRate)} of visitors click buy, so most never reach checkout. Tighten the hero hook and make the CTA more prominent.` });
  } else {
    out.push({ tone: "good", title: "Solid click-through", body: `${pct(d.clickRate)} of visitors click buy. The hook is working, so focus next on closing the checkout step.` });
  }
  if (d.checkoutClicks >= 5 && d.checkoutCompletion < 0.4) {
    out.push({ tone: "warn", title: "Checkout drop-off", body: `${pct(1 - d.checkoutCompletion)} of people who click buy don't finish. That's usually price hesitation. Reassure on the $9.99 price and the guarantee at the button.` });
  }
  if (d.sources.length) {
    const t = d.sources[0];
    out.push({ tone: "info", title: `Top source: ${t.label}`, body: `${fmt(t.visitors)} of your visitors came from ${t.label}. Double down on what's working there.` });
  }
  if (d.avgSeconds && d.avgSeconds < 20 && d.visitors >= 20) {
    out.push({ tone: "warn", title: "Visitors leave fast", body: `Average time on site is ${dur(d.avgSeconds)}. People aren't sticking around, so the first screen needs to grab them faster.` });
  }
  return out.slice(0, 4);
}

export function Takeaways({ items }: { items: Take[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dash-card d-rise" style={{ marginTop: "1.1rem" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "1rem", background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <span>
          <span className="dash-cardtitle" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Takeaways
            <span className="dash-num" style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--d-accent)", background: "rgba(199,147,71,0.12)", borderRadius: 20, padding: "1px 8px" }}>{items.length}</span>
          </span>
          <span className="dash-cardsub" style={{ display: "block" }}>What the numbers say, and what to do about it</span>
        </span>
        <span style={{ color: "var(--d-soft)", display: "grid", placeItems: "center", width: 22, height: 22, transition: "transform .25s var(--ease)", transform: open ? "rotate(180deg)" : "none" }}>
          {I.chevron({ width: 18, height: 18 })}
        </span>
      </button>
      {open && (
        <div className="d-rise" style={{ display: "flex", flexDirection: "column", gap: "0.95rem", marginTop: "1.2rem", animationDuration: ".4s" }}>
          {items.map((t, i) => (
            <div key={i} className={`dash-take ${t.tone}`}>
              <span className="ico">{t.tone === "good" ? I.check({}) : t.tone === "warn" ? I.alert({}) : I.info({})}</span>
              <div>
                <div className="tt">{t.title}</div>
                <div className="bd">{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- section header ---------- */
export function PageHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <h2 style={{ fontFamily: "var(--font-dash)", fontWeight: 600, fontSize: "1.28rem", letterSpacing: "-0.02em", color: "var(--d-ink)", margin: 0 }}>{title}</h2>
      <p style={{ color: "var(--d-soft)", fontSize: "0.88rem", marginTop: 4 }}>{sub}</p>
    </div>
  );
}
