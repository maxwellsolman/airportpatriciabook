"use client";

import Link from "next/link";
import { useDash, useMetrics, useTransactions } from "../shell";
import {
  Bars, CountUp, I, PRICE, Stat, Takeaways, buildTakeaways, buildTrend, TrendChart,
  ago, dur, fmt, money, pct, presetLabel,
} from "../ui";

export default function OverviewPage() {
  const { configured, preset, from, to } = useDash();
  const { data, err } = useMetrics();
  const { pay } = useTransactions();

  const firstLoad = !data;
  const stripeLive = !!data?.stripe?.configured;
  const revenue = stripeLive ? (data?.stripe?.revenue ?? 0) : (data?.purchases ?? 0) * PRICE;
  const revenueHint = stripeLive
    ? `${fmt(data?.stripe?.orders ?? 0)} paid orders`
    : `${fmt(data?.purchases ?? 0)} sales (est.)`;
  const trend = buildTrend(data, from, to);

  return (
    <>
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

      {/* KPI grid */}
      <div className="dash-kpis" style={{ marginTop: "1.6rem" }}>
        <Stat label={stripeLive ? "Revenue" : "Revenue (est.)"} accent loading={firstLoad} value={<CountUp value={revenue} render={money} />} hint={revenueHint} />
        <Stat label="Visitors" loading={firstLoad} value={<CountUp value={data?.visitors ?? 0} render={fmt} />} hint={data ? `${fmt(data.pageviews)} page views` : ""} />
        <Stat label="Purchases" loading={firstLoad} value={<CountUp value={data?.purchases ?? 0} render={fmt} />} hint={data ? `${pct(data.conversionRate)} conversion` : ""} />
        <Stat label="Buy clicks" loading={firstLoad} value={<CountUp value={data?.checkoutClicks ?? 0} render={fmt} />} hint={data ? `${pct(data.clickRate)} of visitors` : ""} />
        <Stat label="Avg. time" loading={firstLoad} value={<CountUp value={data?.avgSeconds ?? 0} render={dur} />} hint="per visit" />
        <Stat label="Checkout rate" loading={firstLoad} value={<CountUp value={data ? data.checkoutCompletion * 100 : 0} render={(n) => `${Math.round(n)}%`} />} hint="clicks → buy" />
      </div>

      <Takeaways items={buildTakeaways(data)} />

      {/* snapshots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "1.1rem", marginTop: "1.1rem" }}>
        {/* Payments snapshot */}
        <div className="dash-card d-rise">
          <SnapHead icon={I.card} title="Payments" href="/dashboard/payments" />
          {pay?.summary ? (
            <>
              <div style={{ display: "flex", gap: "1.8rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <Mini label="Gross" value={money(pay.summary.gross)} />
                <Mini label="Net revenue" value={money(pay.summary.netAfterRefunds)} accent />
                <Mini label="Orders" value={fmt(pay.summary.orders)} />
              </div>
              <div style={{ marginTop: "1.1rem", borderTop: "1px solid var(--d-line)" }}>
                {pay.txns.slice(0, 5).map((t) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--d-line)", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--d-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "58%" }}>{t.email || t.name || "Customer"}</span>
                    <span style={{ display: "flex", gap: "0.8rem", alignItems: "baseline" }}>
                      <span className="dash-num" style={{ color: "var(--d-faint)", fontSize: "0.76rem" }}>{ago(t.created)}</span>
                      <b className="dash-num" style={{ color: "var(--d-ink)" }}>{money(t.gross)}</b>
                    </span>
                  </div>
                ))}
                {pay.txns.length === 0 && <div style={{ color: "var(--d-faint)", fontSize: "0.85rem", padding: "0.7rem 0" }}>No payments in this range.</div>}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--d-faint)", fontSize: "0.85rem", marginTop: "1rem" }}>Loading Stripe&hellip;</div>
          )}
        </div>

        {/* Traffic snapshot */}
        <div className="dash-card d-rise">
          <SnapHead icon={I.traffic} title="Traffic" href="/dashboard/traffic" />
          <div style={{ marginTop: "1.1rem" }}>
            <Bars max={data?.sources[0]?.visitors ?? 1} rows={(data?.sources ?? []).slice(0, 5).map((s) => ({ label: s.label, value: s.visitors }))} />
          </div>
        </div>
      </div>

      {/* visitors trend */}
      <div className="dash-card d-rise" style={{ marginTop: "1.1rem" }}>
        <div className="dash-cardtitle">Visitors over time</div>
        <div className="dash-cardsub">{trend.unit === "hour" ? "By hour, today" : trend.unit === "week" ? `By week · ${presetLabel(preset)}` : `By day · ${presetLabel(preset)}`}</div>
        {data ? <TrendChart rows={trend.rows} max={trend.max} /> : <div className="dash-skel" style={{ height: 140, marginTop: "1.1rem", borderRadius: 10 }} />}
      </div>
    </>
  );
}

function SnapHead({ icon, title, href }: { icon: (p: object) => React.ReactNode; title: string; href: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ color: "var(--d-soft)" }}>{icon({ width: 17, height: 17 })}</span>
        <span className="dash-cardtitle">{title}</span>
      </span>
      <Link href={href} className="dash-link">View all {I.arrow({ width: 15, height: 15 })}</Link>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="dash-label">{label}</div>
      <div className="dash-num" style={{ fontSize: "1.25rem", fontWeight: 600, color: accent ? "var(--d-accent)" : "var(--d-ink)", marginTop: 3 }}>{value}</div>
    </div>
  );
}
