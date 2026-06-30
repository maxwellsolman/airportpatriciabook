"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Metrics } from "@/lib/metrics";

/* ---------- date helpers ---------- */
const ymd = (d: Date) => d.toISOString().slice(0, 10);
function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  { key: "today", label: "Today", range: () => [ymd(new Date()), ymd(new Date())] },
  { key: "7d", label: "Last 7 days", range: () => [ymd(daysAgo(6)), ymd(new Date())] },
  { key: "30d", label: "Last 30 days", range: () => [ymd(daysAgo(29)), ymd(new Date())] },
  { key: "90d", label: "Last 90 days", range: () => [ymd(daysAgo(89)), ymd(new Date())] },
];

/* ---------- format ---------- */
const fmt = (n: number) => Math.round(n).toLocaleString();
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 ? 1 : 0)}%`;
function dur(s: number) {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

/* ---------- animated number ---------- */
function CountUp({ value, render }: { value: number; render: (n: number) => string }) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    const from = ref.current;
    const start = performance.now();
    const dms = 850;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dms);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = from + (value - from) * e;
      setV(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setV(value);
        ref.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{render(v)}</>;
}

/* ---------- primitives ---------- */
function Card({ title, sub, children, action, delay = 0 }: { title?: string; sub?: string; children: React.ReactNode; action?: React.ReactNode; delay?: number }) {
  return (
    <div className="d-rise d-card" style={{ animationDelay: `${delay}ms`, background: "#fff", border: "1px solid var(--paper-edge)", borderRadius: 16, padding: "1.25rem 1.35rem", boxShadow: "0 14px 40px -32px rgba(20,31,48,0.4)" }}>
      {(title || action) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem", gap: "1rem" }}>
          <div>
            {title && <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.96rem", color: "var(--ink)" }}>{title}</div>}
            {sub && <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 3 }}>{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, raw, hint, delay }: { label: string; value: (n: number) => string; raw: number; hint?: string; delay: number }) {
  return (
    <div className="d-rise d-card" style={{ animationDelay: `${delay}ms`, background: "#fff", border: "1px solid var(--paper-edge)", borderRadius: 16, padding: "1.15rem 1.25rem" }}>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "2.05rem", color: "var(--ink)", lineHeight: 1.05, marginTop: 5 }}>
        <CountUp value={raw} render={value} />
      </div>
      <div style={{ fontSize: "0.76rem", color: hint ? "var(--brass-deep)" : "transparent", marginTop: 4, minHeight: "1.05em" }}>{hint || "·"}</div>
    </div>
  );
}

function Bars({ rows, max }: { rows: { label: string; value: number }[]; max: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 40);
    return () => {
      setOn(false);
      clearTimeout(t);
    };
  }, [rows]);
  if (!rows.length) return <Empty />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", marginBottom: 4 }}>
            <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>{r.label}</span>
            <b style={{ color: "var(--ink)" }}>{fmt(r.value)}</b>
          </div>
          <div style={{ height: 9, borderRadius: 6, background: "var(--cream-2)", overflow: "hidden" }}>
            <div className="d-bar-fill" style={{ width: on && max ? `${Math.max(3, (r.value / max) * 100)}%` : "0%", height: "100%", borderRadius: 6, background: "linear-gradient(90deg,#d6ad60,#b9893f)", transitionDelay: `${i * 50}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const Empty = () => <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem", padding: "0.4rem 0" }}>No data in this range yet.</div>;

/* ---------- rule-based takeaways ---------- */
type Take = { tone: "good" | "warn" | "info"; title: string; body: string };
function buildTakeaways(d: Metrics | null): Take[] {
  if (!d || d.visitors === 0) {
    return [{ tone: "info", title: "No traffic yet", body: "Share your first post or ad to start collecting data. Real visits show up here within about a minute." }];
  }
  const out: Take[] = [];
  if (d.visitors < 30) {
    out.push({ tone: "info", title: "Early data", body: `Only ${fmt(d.visitors)} visitors so far. Treat these as directional until you've got a few hundred.` });
  }
  if (d.checkoutClicks === 0) {
    out.push({ tone: "warn", title: "Nobody's clicking buy", body: `${fmt(d.visitors)} visitors and zero buy-button clicks. The hook or offer up top isn't landing. Lead with a punchier headline and pull the price and CTA higher on the page.` });
  } else if (d.clickRate < 0.12) {
    out.push({ tone: "warn", title: "Low buy-button click rate", body: `Only ${pct(d.clickRate)} of visitors click buy, so most never reach checkout. Tighten the hero hook and make the CTA more prominent.` });
  } else {
    out.push({ tone: "good", title: "Solid click-through", body: `${pct(d.clickRate)} of visitors click buy — the hook is working. Focus next on closing the checkout step.` });
  }
  if (d.checkoutClicks >= 5 && d.checkoutCompletion < 0.4) {
    out.push({ tone: "warn", title: "Checkout drop-off", body: `${pct(1 - d.checkoutCompletion)} of people who click buy don't finish. That's usually price hesitation or checkout friction. Reassure on the $9.99 price and the guarantee right at the button.` });
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

const TONE: Record<Take["tone"], { dot: string; icon: string }> = {
  good: { dot: "#2f8f5b", icon: "✓" },
  warn: { dot: "#c8902f", icon: "!" },
  info: { dot: "#5177ff", icon: "i" },
};

/* =================================================================== */
export default function Dashboard({ configured, posthogUrl }: { configured: boolean; posthogUrl: string }) {
  const router = useRouter();
  const [preset, setPreset] = useState("7d");
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (key: string) => {
    const p = PRESETS.find((x) => x.key === key) || PRESETS[1];
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

  async function logout() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    router.replace("/dashboard/login");
  }

  const takeaways = buildTakeaways(data);
  const funnelMax = data ? Math.max(data.visitors, 1) : 1;

  // Build a continuous day-by-day series across the selected range (zero-filled),
  // so the chart shows real bars instead of one solid block.
  const activeRange = (PRESETS.find((p) => p.key === preset) || PRESETS[1]).range();
  const fullTrend: { day: string; visitors: number }[] = [];
  {
    const byDay = new Map((data?.trend ?? []).map((t) => [t.day, t.visitors]));
    const cur = new Date(activeRange[0] + "T00:00:00Z");
    const end = new Date(activeRange[1] + "T00:00:00Z");
    let guard = 0;
    while (cur <= end && guard < 120) {
      const key = ymd(cur);
      fullTrend.push({ day: key, visitors: byDay.get(key) ?? 0 });
      cur.setUTCDate(cur.getUTCDate() + 1);
      guard++;
    }
  }
  const trendMax = Math.max(...fullTrend.map((t) => t.visitors), 1);

  return (
    <main style={{ minHeight: "100dvh", background: "radial-gradient(120% 80% at 50% -10%, #fbf7ee 0%, var(--cream) 45%, var(--cream-2) 100%)", color: "var(--ink)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(1.3rem,4vw,2.6rem)" }}>
        {/* header */}
        <div className="d-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="kicker" style={{ color: "var(--brass-deep)" }}>Airport Patricia</div>
            <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.3rem)", marginTop: 4 }}>Analytics</h1>
          </div>
          <button onClick={logout} className="btn" style={{ background: "transparent", color: "var(--ink)", border: "1.5px solid var(--brass)", boxShadow: "none", padding: "0.6rem 1.1rem", fontSize: "0.9rem" }}>
            Log out
          </button>
        </div>

        {/* date filter */}
        <div className="d-rise" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "1.5rem", animationDelay: "40ms" }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className="d-pill"
              onClick={() => setPreset(p.key)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.85rem",
                fontWeight: 600,
                padding: "0.5rem 1.05rem",
                borderRadius: 100,
                cursor: "pointer",
                border: `1.5px solid ${preset === p.key ? "var(--brass)" : "var(--paper-edge)"}`,
                background: preset === p.key ? "var(--brass)" : "#fff",
                color: preset === p.key ? "#1a1206" : "var(--ink-soft)",
              }}
            >
              {p.label}
            </button>
          ))}
          <span style={{ color: "var(--ink-soft)", fontSize: "0.8rem", opacity: loading ? 1 : 0, transition: "opacity .2s" }}>Loading…</span>
        </div>

        {!configured && (
          <div style={{ marginTop: "1.5rem" }}>
            <Card title="Analytics not connected" sub="Add the PostHog keys in Vercel to start seeing data." delay={60}>
              <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Once the environment variables are set and redeployed, this page fills in automatically.</div>
            </Card>
          </div>
        )}

        {err && (
          <div style={{ marginTop: "1.5rem" }}>
            <Card title="Couldn't load metrics" delay={60}><div style={{ color: "#c0392b", fontSize: "0.88rem" }}>{err}</div></Card>
          </div>
        )}

        {/* takeaways */}
        <div style={{ marginTop: "1.5rem" }}>
          <Card title="Takeaways" sub="What the numbers are telling you, and what to do about it" delay={80}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {takeaways.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: TONE[t.tone].dot, color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: "0.72rem", marginTop: 2 }}>{TONE[t.tone].icon}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>{t.title}</div>
                    <div style={{ color: "var(--ink-soft)", fontSize: "0.88rem", lineHeight: 1.5, marginTop: 2 }}>{t.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.9rem", marginTop: "1.5rem" }}>
          <Stat delay={100} label="Visitors" raw={data?.visitors ?? 0} value={fmt} />
          <Stat delay={140} label="Page views" raw={data?.pageviews ?? 0} value={fmt} />
          <Stat delay={180} label="Avg. time on site" raw={data?.avgSeconds ?? 0} value={dur} />
          <Stat delay={220} label="Checkout clicks" raw={data?.checkoutClicks ?? 0} value={fmt} hint={data ? `${pct(data.clickRate)} of visitors` : undefined} />
          <Stat delay={260} label="Purchases" raw={data?.purchases ?? 0} value={fmt} hint={data ? `${pct(data.conversionRate)} conversion` : undefined} />
          <Stat delay={300} label="Checkout completion" raw={data ? data.checkoutCompletion * 100 : 0} value={(n) => `${Math.round(n)}%`} hint="clicks → purchase" />
        </div>

        {/* funnel */}
        <div style={{ marginTop: "1.2rem" }}>
          <Card title="Funnel" sub="Where people drop off on the way to buying" delay={120}>
            <Bars
              max={funnelMax}
              rows={[
                { label: "Visited the site", value: data?.visitors ?? 0 },
                { label: "Clicked a buy button", value: data?.checkoutClicks ?? 0 },
                { label: "Bought (reached thank-you)", value: data?.purchases ?? 0 },
              ]}
            />
            {data && data.visitors > 0 && (
              <div style={{ display: "flex", gap: "1.6rem", flexWrap: "wrap", marginTop: "1rem", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                <span>Visitor → click: <b style={{ color: "var(--ink)" }}>{pct(data.clickRate)}</b></span>
                <span>Click → purchase: <b style={{ color: "var(--ink)" }}>{pct(data.checkoutCompletion)}</b></span>
                <span>Overall: <b style={{ color: "var(--ink)" }}>{pct(data.conversionRate)}</b></span>
              </div>
            )}
          </Card>
        </div>

        {/* sources + pages */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem", marginTop: "1.1rem" }}>
          <Card title="Traffic sources" sub="Where visitors come from" delay={140}>
            <Bars max={data?.sources[0]?.visitors ?? 1} rows={(data?.sources ?? []).map((s) => ({ label: s.label, value: s.visitors }))} />
          </Card>
          <Card title="Top pages" sub="Most viewed" delay={160}>
            <Bars max={data?.pages[0]?.views ?? 1} rows={(data?.pages ?? []).map((p) => ({ label: p.path, value: p.views }))} />
          </Card>
        </div>

        {/* trend + devices */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem", marginTop: "1.1rem" }}>
          <Card title="Visitors over time" delay={180}>
            {data ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: fullTrend.length > 40 ? 1 : 4, height: 130 }}>
                {fullTrend.map((t, i) => (
                  <div key={i} title={`${t.day}: ${t.visitors} visitors`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    <div className="d-bar-fill" style={{ height: `${t.visitors ? Math.max(4, (t.visitors / trendMax) * 100) : 2}%`, background: t.visitors ? "linear-gradient(180deg,#d6ad60,#b9893f)" : "var(--cream-2)", borderRadius: "4px 4px 0 0", transitionDelay: `${i * 25}ms` }} />
                  </div>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </Card>
          <Card title="Devices" delay={200}>
            <Bars max={data?.devices[0]?.visitors ?? 1} rows={(data?.devices ?? []).map((d) => ({ label: d.label, value: d.visitors }))} />
          </Card>
        </div>

        {/* heatmaps */}
        <div style={{ marginTop: "1.1rem" }}>
          <Card title="Heatmaps & session recordings" sub="See exactly where people click, scroll, and drop off" delay={220}>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1rem" }}>
              Click maps, scroll depth, and full session replays are recording now. Open them to watch real visits and spot where the page loses people.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <a className="btn" href={`${posthogUrl}/heatmaps`} target="_blank" rel="noopener noreferrer" style={{ padding: "0.6rem 1.1rem", fontSize: "0.88rem" }}>Open heatmaps</a>
              <a className="btn" href={`${posthogUrl}/replay`} target="_blank" rel="noopener noreferrer" style={{ background: "transparent", color: "var(--ink)", border: "1.5px solid var(--brass)", boxShadow: "none", padding: "0.6rem 1.1rem", fontSize: "0.88rem" }}>Session recordings</a>
            </div>
          </Card>
        </div>

        <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: "0.76rem", marginTop: "2rem", lineHeight: 1.6 }}>
          Purchases are counted only when someone actually completes Stripe checkout, so visiting the thank-you page yourself never counts as a sale.<br />
          Revenue and refunds live in your Stripe dashboard.
        </p>
      </div>
    </main>
  );
}
