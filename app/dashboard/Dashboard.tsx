"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Metrics } from "@/lib/metrics";

const PRICE = 9.99; // per PDF; Stripe fees ignored

/* ---------- date helpers ---------- */
const ymd = (d: Date) => d.toISOString().slice(0, 10);
function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  { key: "today", label: "Today", range: () => [ymd(new Date()), ymd(new Date())] },
  { key: "7d", label: "7 days", range: () => [ymd(daysAgo(6)), ymd(new Date())] },
  { key: "30d", label: "30 days", range: () => [ymd(daysAgo(29)), ymd(new Date())] },
  { key: "90d", label: "90 days", range: () => [ymd(daysAgo(89)), ymd(new Date())] },
];

/* ---------- format ---------- */
const fmt = (n: number) => Math.round(n).toLocaleString();
const money = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 && n > 0 ? 1 : 0)}%`;
function dur(s: number) {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

/* ---------- icons (no emoji) ---------- */
const I = {
  overview: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  funnel: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 4h18l-7 8v7l-4 2v-9L3 4z" /></svg>),
  traffic: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 19V10M10 19V5M16 19v-6M22 19V8" /></svg>),
  behavior: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  logout: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>),
  check: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5" /></svg>),
  alert: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>),
  info: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>),
  brand: (p: object) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12h4l2-7 4 18 2-9h6" /></svg>),
};

/* ---------- animated number ---------- */
function CountUp({ value, render }: { value: number; render: (n: number) => string }) {
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

/* ---------- bars ---------- */
function Bars({ rows, max, mono = true }: { rows: { label: string; value: number }[]; max: number; mono?: boolean }) {
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
            <b className={mono ? "dash-num" : ""} style={{ color: "var(--d-ink)", fontWeight: 600 }}>{fmt(r.value)}</b>
          </div>
          <div className="dash-track">
            <div className="dash-fill" style={{ width: on && max ? `${Math.max(3, (r.value / max) * 100)}%` : "0%", transitionDelay: `${i * 55}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- takeaways ---------- */
type Take = { tone: "good" | "warn" | "info"; title: string; body: string };
function buildTakeaways(d: Metrics | null): Take[] {
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

/* =================================================================== */
export default function Dashboard({ configured, posthogUrl }: { configured: boolean; posthogUrl: string }) {
  const router = useRouter();
  const [preset, setPreset] = useState("today");
  const [section, setSection] = useState("overview");
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (key: string) => {
    const p = PRESETS.find((x) => x.key === key) || PRESETS[0];
    const [from, to] = p.range();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/dashboard/metrics?from=${from}&to=${to}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Request failed");
      setData(json as Metrics);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(preset);
  }, [preset, load]);

  function go(id: string) {
    setSection(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function logout() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    router.replace("/dashboard/login");
  }

  const takeaways = buildTakeaways(data);
  const revenue = (data?.purchases ?? 0) * PRICE;
  const funnelMax = data ? Math.max(data.visitors, 1) : 1;

  // trend chart: 24 hourly slots for a single day, else one bar per day
  const activeRange = (PRESETS.find((p) => p.key === preset) || PRESETS[0]).range();
  let fullTrend: { label: string; visitors: number }[] = [];
  if (data?.trendUnit === "hour") {
    const byHour = new Map(data.trend.map((t) => [Number(t.day), t.visitors]));
    fullTrend = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, "0")}:00`, visitors: byHour.get(h) ?? 0 }));
  } else {
    const byDay = new Map((data?.trend ?? []).map((t) => [t.day, t.visitors]));
    const cur = new Date(activeRange[0] + "T00:00:00Z");
    const end = new Date(activeRange[1] + "T00:00:00Z");
    let g = 0;
    while (cur <= end && g < 120) {
      const k = ymd(cur);
      fullTrend.push({ label: k, visitors: byDay.get(k) ?? 0 });
      cur.setUTCDate(cur.getUTCDate() + 1);
      g++;
    }
  }
  const trendMax = Math.max(...fullTrend.map((t) => t.visitors), 1);

  const NAV = [
    { id: "overview", label: "Overview", icon: I.overview },
    { id: "funnel", label: "Funnel", icon: I.funnel },
    { id: "traffic", label: "Traffic", icon: I.traffic },
    { id: "behavior", label: "Behavior", icon: I.behavior },
  ];

  const firstLoad = loading && !data;

  return (
    <div className="dash">
      <div className="dash-shell">
        {/* ---------- sidebar ---------- */}
        <aside className="dash-side">
          <div className="dash-brand">
            <span className="mk">{I.brand({ width: 18, height: 18 })}</span>
            <span>
              <span className="nm" style={{ display: "block", color: "#fff" }}>Airport Patricia</span>
              <span className="sb">Analytics</span>
            </span>
          </div>
          <nav className="dash-nav">
            {NAV.map((n) => (
              <button key={n.id} className={`dash-navitem${section === n.id ? " on" : ""}`} onClick={() => go(n.id)}>
                {n.icon({})}
                {n.label}
              </button>
            ))}
          </nav>
          <span className="spacer" />
          <button className="dash-logout" onClick={logout}>{I.logout({})}Log out</button>
        </aside>

        {/* ---------- main ---------- */}
        <main className="dash-main">
          {/* top bar */}
          <div className="dash-top d-rise">
            <div>
              <div className="crumb">{NAV.find((n) => n.id === section)?.label ?? "Overview"}</div>
              <h1>Performance</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
              <span className="dash-num" style={{ fontSize: "0.74rem", color: "var(--d-faint)", opacity: loading ? 1 : 0, transition: "opacity .2s" }}>syncing…</span>
              <div className="dash-dates">
                {PRESETS.map((p) => (
                  <button key={p.key} className={`dash-datebtn${preset === p.key ? " on" : ""}`} onClick={() => setPreset(p.key)}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>

          {!configured && (
            <div className="dash-card d-rise" style={{ marginTop: "1.5rem" }}>
              <div className="dash-cardtitle">Analytics not connected</div>
              <div className="dash-cardsub">Add the PostHog keys in Vercel and redeploy. This page fills in automatically.</div>
            </div>
          )}
          {err && (
            <div className="dash-card d-rise" style={{ marginTop: "1.5rem" }}>
              <div className="dash-cardtitle">Couldn&rsquo;t load metrics</div>
              <div style={{ color: "#c0392b", fontSize: "0.85rem", marginTop: 6 }}>{err}</div>
            </div>
          )}

          {/* ===== OVERVIEW ===== */}
          <section id="sec-overview" style={{ scrollMarginTop: "1.5rem" }}>
            {/* takeaways */}
            <div className="dash-card d-rise" style={{ marginTop: "1.6rem", animationDelay: "40ms" }}>
              <div className="dash-cardtitle">Takeaways</div>
              <div className="dash-cardsub">What the numbers say, and what to do about it</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem", marginTop: "1.1rem" }}>
                {takeaways.map((t, i) => (
                  <div key={i} className={`dash-take ${t.tone}`}>
                    <span className="ico">{t.tone === "good" ? I.check({}) : t.tone === "warn" ? I.alert({}) : I.info({})}</span>
                    <div>
                      <div className="tt">{t.title}</div>
                      <div className="bd">{t.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI grid */}
            <div className="dash-kpis">
              {[
                { label: "Revenue", node: <span className="v accent"><CountUp value={revenue} render={money} /></span>, hint: `${fmt(data?.purchases ?? 0)} sales at $9.99` },
                { label: "Visitors", node: <span className="v"><CountUp value={data?.visitors ?? 0} render={fmt} /></span>, hint: data ? `${fmt(data.pageviews)} page views` : "" },
                { label: "Purchases", node: <span className="v"><CountUp value={data?.purchases ?? 0} render={fmt} /></span>, hint: data ? `${pct(data.conversionRate)} conversion` : "" },
                { label: "Buy clicks", node: <span className="v"><CountUp value={data?.checkoutClicks ?? 0} render={fmt} /></span>, hint: data ? `${pct(data.clickRate)} of visitors` : "" },
                { label: "Avg. time", node: <span className="v"><CountUp value={data?.avgSeconds ?? 0} render={dur} /></span>, hint: "per visit" },
                { label: "Checkout rate", node: <span className="v"><CountUp value={data ? data.checkoutCompletion * 100 : 0} render={(n) => `${Math.round(n)}%`} /></span>, hint: "clicks → buy" },
              ].map((k, i) => (
                <div key={k.label} className="dash-card dash-stat d-rise" style={{ animationDelay: `${80 + i * 35}ms` }}>
                  <div className="dash-label">{k.label}</div>
                  {firstLoad ? <div className="dash-skel" style={{ height: 30, width: "70%", marginTop: 9 }} /> : k.node}
                  <div className="h">{k.hint || " "}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== FUNNEL ===== */}
          <section id="sec-funnel" style={{ scrollMarginTop: "1.5rem", marginTop: "1.1rem" }}>
            <div className="dash-card d-rise" style={{ animationDelay: "120ms" }}>
              <div className="dash-cardtitle">Funnel</div>
              <div className="dash-cardsub">Where people drop off on the way to buying</div>
              <div style={{ marginTop: "1.1rem" }}>
                <Bars
                  max={funnelMax}
                  rows={[
                    { label: "Visited the site", value: data?.visitors ?? 0 },
                    { label: "Clicked a buy button", value: data?.checkoutClicks ?? 0 },
                    { label: "Bought (completed checkout)", value: data?.purchases ?? 0 },
                  ]}
                />
              </div>
              {data && data.visitors > 0 && (
                <div style={{ display: "flex", gap: "1.8rem", flexWrap: "wrap", marginTop: "1.1rem", fontSize: "0.82rem", color: "var(--d-soft)" }}>
                  <span>Visitor → click <b className="dash-num" style={{ color: "var(--d-ink)" }}>{pct(data.clickRate)}</b></span>
                  <span>Click → buy <b className="dash-num" style={{ color: "var(--d-ink)" }}>{pct(data.checkoutCompletion)}</b></span>
                  <span>Overall <b className="dash-num" style={{ color: "var(--d-ink)" }}>{pct(data.conversionRate)}</b></span>
                </div>
              )}
            </div>
          </section>

          {/* ===== TRAFFIC ===== */}
          <section id="sec-traffic" style={{ scrollMarginTop: "1.5rem", marginTop: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem" }}>
              <div className="dash-card d-rise" style={{ animationDelay: "140ms" }}>
                <div className="dash-cardtitle">Traffic sources</div>
                <div className="dash-cardsub">Where visitors come from</div>
                <div style={{ marginTop: "1.1rem" }}>
                  <Bars max={data?.sources[0]?.visitors ?? 1} rows={(data?.sources ?? []).map((s) => ({ label: s.label, value: s.visitors }))} />
                </div>
              </div>
              <div className="dash-card d-rise" style={{ animationDelay: "160ms" }}>
                <div className="dash-cardtitle">Top pages</div>
                <div className="dash-cardsub">Most viewed</div>
                <div style={{ marginTop: "1.1rem" }}>
                  <Bars max={data?.pages[0]?.views ?? 1} rows={(data?.pages ?? []).map((p) => ({ label: p.path, value: p.views }))} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem", marginTop: "1.1rem" }}>
              <div className="dash-card d-rise" style={{ animationDelay: "180ms" }}>
                <div className="dash-cardtitle">Visitors over time</div>
                <div className="dash-cardsub">{data?.trendUnit === "hour" ? "By hour, today" : "By day"}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: fullTrend.length > 30 ? 2 : 5, height: 140, marginTop: "1.1rem" }}>
                  {data ? fullTrend.map((t, i) => (
                    <div key={i} title={`${t.label}: ${t.visitors} visitor${t.visitors === 1 ? "" : "s"}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                      <div className="dash-fill" style={{ height: `${t.visitors ? Math.max(5, (t.visitors / trendMax) * 100) : 2}%`, borderRadius: "4px 4px 0 0", background: t.visitors ? "linear-gradient(180deg,var(--d-accent-2),var(--d-accent))" : "#efece4", transitionDelay: `${i * 18}ms`, width: "100%" }} />
                    </div>
                  )) : null}
                </div>
              </div>
              <div className="dash-card d-rise" style={{ animationDelay: "200ms" }}>
                <div className="dash-cardtitle">Devices</div>
                <div style={{ marginTop: "1.1rem" }}>
                  <Bars max={data?.devices[0]?.visitors ?? 1} rows={(data?.devices ?? []).map((d) => ({ label: d.label, value: d.visitors }))} />
                </div>
              </div>
            </div>
          </section>

          {/* ===== BEHAVIOR ===== */}
          <section id="sec-behavior" style={{ scrollMarginTop: "1.5rem", marginTop: "1.1rem" }}>
            <div className="dash-card d-rise" style={{ animationDelay: "220ms" }}>
              <div className="dash-cardtitle">Heatmaps &amp; session recordings</div>
              <div className="dash-cardsub">See exactly where people click, scroll, and drop off</div>
              <p style={{ color: "var(--d-soft)", fontSize: "0.88rem", lineHeight: 1.6, margin: "1rem 0" }}>
                Click maps, scroll depth, and full session replays are recording now. Open them to watch real visits and spot where the page loses people.
              </p>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <a href={`${posthogUrl}/heatmaps`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-dash)", fontSize: "0.86rem", fontWeight: 600, padding: "0.62rem 1.1rem", borderRadius: 10, background: "var(--d-ink)", color: "#fff", textDecoration: "none" }}>Open heatmaps</a>
                <a href={`${posthogUrl}/replay`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-dash)", fontSize: "0.86rem", fontWeight: 600, padding: "0.62rem 1.1rem", borderRadius: 10, background: "transparent", color: "var(--d-ink)", border: "1px solid var(--d-line)", textDecoration: "none" }}>Session recordings</a>
              </div>
            </div>
          </section>

          <p style={{ textAlign: "center", color: "var(--d-faint)", fontSize: "0.76rem", marginTop: "2.2rem", lineHeight: 1.65 }}>
            Revenue is sales × $9.99 and ignores Stripe fees. Purchases count only completed Stripe checkouts, so visiting the<br />
            thank-you page yourself never counts as a sale. Exact payouts and refunds live in your Stripe dashboard.
          </p>
        </main>
      </div>
    </div>
  );
}
