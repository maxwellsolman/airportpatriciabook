"use client";

import { useDash, useMetrics } from "../../shell";
import { Bars, pct, presetLabel } from "../../ui";

export default function FunnelPage() {
  const { preset } = useDash();
  const { data, err } = useMetrics();
  const funnelMax = data ? Math.max(data.visitors, 1) : 1;

  return (
    <>
      <p className="dash-cardsub" style={{ margin: "0.3rem 0 1.4rem" }}>Where people drop off on the way to buying · {presetLabel(preset)}</p>

      {err && <div className="dash-card" style={{ color: "#c0392b", fontSize: "0.85rem" }}>{err}</div>}

      <div className="dash-card d-rise">
        <div className="dash-cardtitle">Visitor → buyer</div>
        <div className="dash-cardsub">Each step as a share of everyone who landed</div>
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
          <div style={{ display: "flex", gap: "1.8rem", flexWrap: "wrap", marginTop: "1.3rem", fontSize: "0.82rem", color: "var(--d-soft)" }}>
            <span>Visitor → click <b className="dash-num" style={{ color: "var(--d-ink)" }}>{pct(data.clickRate)}</b></span>
            <span>Click → buy <b className="dash-num" style={{ color: "var(--d-ink)" }}>{pct(data.checkoutCompletion)}</b></span>
            <span>Overall <b className="dash-num" style={{ color: "var(--d-ink)" }}>{pct(data.conversionRate)}</b></span>
          </div>
        )}
      </div>
    </>
  );
}
