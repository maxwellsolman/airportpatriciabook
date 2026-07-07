"use client";

import { useDash, useMetrics } from "../../shell";
import { Bars, TrendChart, buildTrend, presetLabel } from "../../ui";

export default function TrafficPage() {
  const { preset, from, to } = useDash();
  const { data, err } = useMetrics();
  const trend = buildTrend(data, from, to);

  return (
    <>
      <p className="dash-cardsub" style={{ margin: "0.3rem 0 1.4rem" }}>Where visitors come from · {presetLabel(preset)}</p>

      {err && <div className="dash-card" style={{ color: "#c0392b", fontSize: "0.85rem" }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem" }}>
        <div className="dash-card d-rise">
          <div className="dash-cardtitle">Traffic sources</div>
          <div className="dash-cardsub">Referrer of each visitor</div>
          <div style={{ marginTop: "1.1rem" }}>
            <Bars max={data?.sources[0]?.visitors ?? 1} rows={(data?.sources ?? []).map((s) => ({ label: s.label, value: s.visitors }))} />
          </div>
        </div>
        <div className="dash-card d-rise">
          <div className="dash-cardtitle">Top pages</div>
          <div className="dash-cardsub">Most viewed paths</div>
          <div style={{ marginTop: "1.1rem" }}>
            <Bars max={data?.pages[0]?.views ?? 1} rows={(data?.pages ?? []).map((p) => ({ label: p.path, value: p.views }))} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem", marginTop: "1.1rem" }}>
        <div className="dash-card d-rise">
          <div className="dash-cardtitle">Visitors over time</div>
          <div className="dash-cardsub">{trend.unit === "hour" ? "By hour, today" : trend.unit === "week" ? `By week · ${presetLabel(preset)}` : `By day · ${presetLabel(preset)}`}</div>
          {data ? <TrendChart rows={trend.rows} max={trend.max} /> : <div className="dash-skel" style={{ height: 140, marginTop: "1.1rem", borderRadius: 10 }} />}
        </div>
        <div className="dash-card d-rise">
          <div className="dash-cardtitle">Devices</div>
          <div className="dash-cardsub">What visitors browse on</div>
          <div style={{ marginTop: "1.1rem" }}>
            <Bars max={data?.devices[0]?.visitors ?? 1} rows={(data?.devices ?? []).map((d) => ({ label: d.label, value: d.visitors }))} />
          </div>
        </div>
      </div>
    </>
  );
}
