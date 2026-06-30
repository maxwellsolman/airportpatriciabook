import type { Metadata } from "next";
import { PRODUCT } from "@/lib/config";

export const metadata: Metadata = {
  title: "Your Playbook Is Ready · Airport Patricia",
  description: "Thanks for your purchase. Download Patricia's Insider Travel Playbook.",
  robots: { index: false, follow: false },
};

const PDF = "/patricia-insider-travel-playbook.pdf";
const PDF_NAME = "Patricia-Insider-Travel-Playbook.pdf";

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const Download = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

const Open = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
);

export default function ThankYou() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(180deg,var(--cream),var(--cream-2))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(2rem,7vw,4rem) 1.2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* confirmation seal */}
        <div
          style={{
            width: 84,
            height: 84,
            margin: "0 auto 1.8rem",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(180deg,#d6ad60,#b9893f)",
            color: "#1a1206",
            boxShadow: "0 14px 32px -10px rgba(193,154,82,0.7), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <span style={{ width: 38, height: 38, display: "block" }}>
            <Check />
          </span>
        </div>

        <span className="kicker" style={{ color: "var(--brass-deep)" }}>
          Payment confirmed
        </span>

        <h1 style={{ fontSize: "clamp(2rem,6vw,2.9rem)", marginTop: "0.7rem" }}>
          You&rsquo;re in. Here&rsquo;s your <span className="em-brass">playbook.</span>
        </h1>

        <p
          style={{
            color: "var(--ink-soft)",
            fontSize: "clamp(1.02rem,2.4vw,1.15rem)",
            marginTop: "1.1rem",
            lineHeight: 1.6,
            maxWidth: "44ch",
            marginInline: "auto",
          }}
        >
          Thank you for grabbing <b style={{ color: "var(--ink)" }}>{PRODUCT.name}</b>.
          All {PRODUCT.pages} pages, plus the Pre-Flight Checklist tear-out, are yours below.
          Save it to your phone so it&rsquo;s with you on every trip.
        </p>

        {/* actions */}
        <div
          style={{
            display: "flex",
            gap: "0.9rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "2rem",
          }}
        >
          <a className="btn btn-lg btn-shine" href={PDF} download={PDF_NAME}>
            <Download /> Download the PDF
          </a>
          <a
            className="btn btn-lg"
            href={PDF}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "transparent",
              color: "var(--ink)",
              border: "1.5px solid var(--brass)",
              boxShadow: "none",
            }}
          >
            <Open /> Open in browser
          </a>
        </div>

        <p
          style={{
            marginTop: "1.6rem",
            fontFamily: "var(--font-ui)",
            fontSize: "0.82rem",
            color: "var(--ink-soft)",
          }}
        >
          Trouble downloading? Tap <b>Open in browser</b>, then save from there.
        </p>

        <div
          style={{
            marginTop: "2.6rem",
            paddingTop: "1.6rem",
            borderTop: "1px solid var(--paper-edge)",
            fontFamily: "var(--font-ui)",
            fontSize: "0.8rem",
            color: "var(--ink-soft)",
          }}
        >
          <a href="/" style={{ color: "var(--brass-deep)", fontWeight: 700 }}>
            ← Back to Airport Patricia
          </a>
        </div>
      </div>
    </main>
  );
}
