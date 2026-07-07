"use client";

import { useDash } from "../../shell";

export default function BehaviorPage() {
  const { posthogUrl, configured } = useDash();

  return (
    <>
      <p className="dash-cardsub" style={{ margin: "0.3rem 0 1.4rem" }}>See exactly where people click, scroll, and drop off</p>

      <div className="dash-card d-rise">
        <div className="dash-cardtitle">Heatmaps &amp; session recordings</div>
        <div className="dash-cardsub">Powered by PostHog</div>
        <p style={{ color: "var(--d-soft)", fontSize: "0.88rem", lineHeight: 1.6, margin: "1rem 0" }}>
          Click maps, scroll depth, and full session replays are recording now. Open them to watch real visits and spot where the page loses people.
        </p>
        {configured ? (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <a href={`${posthogUrl}/heatmaps`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-dash)", fontSize: "0.86rem", fontWeight: 600, padding: "0.62rem 1.1rem", borderRadius: 10, background: "var(--d-ink)", color: "#fff", textDecoration: "none" }}>Open heatmaps</a>
            <a href={`${posthogUrl}/replay`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-dash)", fontSize: "0.86rem", fontWeight: 600, padding: "0.62rem 1.1rem", borderRadius: 10, background: "transparent", color: "var(--d-ink)", border: "1px solid var(--d-line)", textDecoration: "none" }}>Session recordings</a>
          </div>
        ) : (
          <div style={{ color: "var(--d-faint)", fontSize: "0.85rem" }}>Add the PostHog keys in Vercel to enable heatmaps and recordings.</div>
        )}
      </div>
    </>
  );
}
