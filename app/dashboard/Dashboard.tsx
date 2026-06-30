"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Metrics } from "@/lib/metrics";
import type { Snapshot } from "@/lib/snapshot";

/* ---------- helpers ---------- */
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

const fmt = (n: number) => n.toLocaleString();
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
function dur(s: number) {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

/* ---------- tiny markdown for the AI briefing ---------- */
function Briefing({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: number) => {
    if (bullets.length) {
      out.push(
        <ul key={`u${k}`} style={{ margin: "0.3rem 0 0.8rem 1.1rem", color: "var(--ink-soft)" }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ marginBottom: "0.3rem" }}>{b}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flush(i);
      out.push(
        <div key={`h${i}`} className="kicker" style={{ color: "var(--brass-deep)", marginTop: out.length ? "1rem" : 0 }}>
          {line.slice(3)}
        </div>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      bullets.push(line.slice(2));
    } else if (line) {
      flush(i);
      out.push(
        <p key={`p${i}`} style={{ color: "var(--ink-soft)", margin: "0.3rem 0", lineHeight: 1.55 }}>{line}</p>,
      );
    }
  });
  flush(9999);
  return <>{out}</>;
}

/* ---------- reusable card ---------- */
function Card({ title, sub, children, action }: { title?: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--paper-edge)", borderRadius: 14, padding: "1.2rem 1.3rem", boxShadow: "0 14px 40px -32px rgba(20,31,48,0.4)" }}>
      {(title || action) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.9rem" }}>
          <div>
            {title && <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>{title}</div>}
            {sub && <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--paper-edge)", borderRadius: 14, padding: "1.1rem 1.2rem" }}>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "2rem", color: "var(--ink)", lineHeight: 1.05, marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: "0.76rem", color: "var(--brass-deep)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Bars({ rows, max }: { rows: { label: string; value: number }[]; max: number }) {
  if (!rows.length) return <Empty />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.83rem", marginBottom: 3 }}>
            <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{r.label}</span>
            <b style={{ color: "var(--ink)" }}>{fmt(r.value)}</b>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: "var(--cream-2)", overflow: "hidden" }}>
            <div style={{ width: `${max ? Math.max(3, (r.value / max) * 100) : 0}%`, height: "100%", background: "linear-gradient(90deg,#d6ad60,#b9893f)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const Empty = () => <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem", padding: "0.4rem 0" }}>No data in this range yet.</div>;

/* =================================================================== */
export default function Dashboard({ snapshot, configured, posthogUrl }: { snapshot: Snapshot | null; configured: boolean; posthogUrl: string }) {
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

  const funnelMax = data ? Math.max(data.visitors, 1) : 1;
  const trendMax = data ? Math.max(...data.trend.map((t) => t.visitors), 1) : 1;

  return (
    <main style={{ minHeight: "100dvh", background: "linear-gradient(180deg,var(--cream),var(--cream-2))", color: "var(--ink)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(1.2rem,4vw,2.4rem)" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="kicker" style={{ color: "var(--brass-deep)" }}>Airport Patricia</div>
            <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", marginTop: 4 }}>Analytics</h1>
          </div>
          <button onClick={logout} className="btn" style={{ background: "transparent", color: "var(--ink)", border: "1.5px solid var(--brass)", boxShadow: "none", padding: "0.6rem 1.1rem", fontSize: "0.9rem" }}>
            Log out
          </button>
        </div>

        {/* date filter */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1.4rem" }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.85rem",
                fontWeight: 600,
                padding: "0.5rem 1rem",
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
          {loading && <span style={{ alignSelf: "center", color: "var(--ink-soft)", fontSize: "0.82rem" }}>Loading…</span>}
        </div>

        {!configured && (
          <div style={{ marginTop: "1.4rem" }}>
            <Card title="Finish connecting analytics" sub="The dashboard is live, but PostHog isn't wired up yet.">
              <ol style={{ margin: "0 0 0 1.1rem", color: "var(--ink-soft)", lineHeight: 1.7, fontSize: "0.9rem" }}>
                <li>Create a free project at posthog.com.</li>
                <li>Add <code>NEXT_PUBLIC_POSTHOG_KEY</code>, <code>POSTHOG_PROJECT_ID</code>, and <code>POSTHOG_PERSONAL_API_KEY</code> in Vercel → Project → Settings → Environment Variables.</li>
                <li>Add <code>ANTHROPIC_API_KEY</code> for the daily AI briefing, then redeploy.</li>
              </ol>
            </Card>
          </div>
        )}

        {err && (
          <div style={{ marginTop: "1.4rem" }}>
            <Card title="Couldn't load metrics"><div style={{ color: "#c0392b", fontSize: "0.88rem" }}>{err}</div></Card>
          </div>
        )}

        {/* AI briefing */}
        <div style={{ marginTop: "1.4rem" }}>
          <Card title="Daily briefing" sub={snapshot ? `Updated ${new Date(snapshot.generatedAt).toLocaleString()} · ${snapshot.window}` : "Generated every morning at 5am ET"}>
            {snapshot?.takeaways ? <Briefing text={snapshot.takeaways} /> : <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>The first briefing publishes at the next 5am ET run (needs PostHog + ANTHROPIC_API_KEY connected).</div>}
          </Card>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.9rem", marginTop: "1.4rem" }}>
          <Stat label="Visitors" value={fmt(data?.visitors ?? 0)} />
          <Stat label="Page views" value={fmt(data?.pageviews ?? 0)} />
          <Stat label="Avg. time on site" value={dur(data?.avgSeconds ?? 0)} />
          <Stat label="Checkout clicks" value={fmt(data?.checkoutClicks ?? 0)} hint={data ? `${pct(data.clickRate)} of visitors` : undefined} />
          <Stat label="Purchases" value={fmt(data?.purchases ?? 0)} hint={data ? `${pct(data.conversionRate)} conversion` : undefined} />
          <Stat label="Checkout completion" value={data ? pct(data.checkoutCompletion) : "0%"} hint="clicks → purchase" />
        </div>

        {/* funnel */}
        <div style={{ marginTop: "1.4rem" }}>
          <Card title="Funnel" sub="Where people drop off on the way to buying">
            <Bars
              max={funnelMax}
              rows={[
                { label: "Visited the site", value: data?.visitors ?? 0 },
                { label: "Clicked a buy button", value: data?.checkoutClicks ?? 0 },
                { label: "Reached the thank-you page (purchase)", value: data?.purchases ?? 0 },
              ]}
            />
            {data && data.visitors > 0 && (
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.9rem", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                <span>Visitor → click: <b style={{ color: "var(--ink)" }}>{pct(data.clickRate)}</b></span>
                <span>Click → purchase: <b style={{ color: "var(--ink)" }}>{pct(data.checkoutCompletion)}</b></span>
                <span>Overall: <b style={{ color: "var(--ink)" }}>{pct(data.conversionRate)}</b></span>
              </div>
            )}
          </Card>
        </div>

        {/* two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem", marginTop: "1.4rem" }}>
          <Card title="Traffic sources" sub="Where visitors come from">
            <Bars max={data?.sources[0]?.visitors ?? 1} rows={(data?.sources ?? []).map((s) => ({ label: s.label, value: s.visitors }))} />
          </Card>
          <Card title="Top pages" sub="Most viewed">
            <Bars max={data?.pages[0]?.views ?? 1} rows={(data?.pages ?? []).map((p) => ({ label: p.path, value: p.views }))} />
          </Card>
        </div>

        {/* trend + devices */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem", marginTop: "1.1rem" }}>
          <Card title="Visitors over time">
            {data && data.trend.length ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
                {data.trend.map((t, i) => (
                  <div key={i} title={`${t.day}: ${t.visitors}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ height: `${Math.max(2, (t.visitors / trendMax) * 100)}%`, background: "linear-gradient(180deg,#d6ad60,#b9893f)", borderRadius: "4px 4px 0 0" }} />
                  </div>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </Card>
          <Card title="Devices">
            <Bars max={data?.devices[0]?.visitors ?? 1} rows={(data?.devices ?? []).map((d) => ({ label: d.label, value: d.visitors }))} />
          </Card>
        </div>

        {/* behavior / heatmaps */}
        <div style={{ marginTop: "1.1rem" }}>
          <Card title="Heatmaps & session recordings" sub="See exactly where people click, scroll, and drop off">
            <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "0.9rem" }}>
              Click maps, scroll depth, and full session replays live in PostHog. Open them to watch real visits and spot where the page loses people.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <a className="btn" href={`${posthogUrl}/heatmaps`} target="_blank" rel="noopener noreferrer" style={{ padding: "0.6rem 1.1rem", fontSize: "0.88rem" }}>Open heatmaps</a>
              <a className="btn" href={`${posthogUrl}/replay`} target="_blank" rel="noopener noreferrer" style={{ background: "transparent", color: "var(--ink)", border: "1.5px solid var(--brass)", boxShadow: "none", padding: "0.6rem 1.1rem", fontSize: "0.88rem" }}>Session recordings</a>
            </div>
          </Card>
        </div>

        <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: "0.76rem", marginTop: "2rem" }}>
          Sales totals (revenue, refunds) live in your Stripe dashboard. Purchases here are counted from thank-you page visits.
        </p>
      </div>
    </main>
  );
}
