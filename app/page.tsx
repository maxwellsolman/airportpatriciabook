"use client";

import { useEffect, useRef, useState } from "react";
import { STRIPE_BUY_URL, PRICE, PRODUCT, SECTIONS, FAQ, TESTIMONIALS } from "@/lib/config";

/* ---------- tiny presentational helpers ---------- */
function Seal({ size = 96, onDark = true }: { size?: number; onDark?: boolean }) {
  const ring = onDark ? "#c19a52" : "#9a7634";
  const ring2 = onDark ? "rgba(216,178,107,0.5)" : "rgba(154,118,52,0.45)";
  const txt = onDark ? "#d8b26b" : "#9a7634";
  const num = onDark ? "#d8b26b" : "#9a7634";
  const lbl = onDark ? "rgba(255,255,255,0.8)" : "rgba(122,113,92,0.9)";
  return (
    <div className="seal-svg" style={{ width: size, height: size, position: "relative" }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="48" fill="none" stroke={ring} strokeWidth="1" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={ring2} strokeWidth="0.6" />
        <defs>
          <path id="sealpath" d="M50,50 m-33,0 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0" />
        </defs>
        <text fontFamily="var(--font-ui)" fontSize="6.3" letterSpacing="2" fill={txt} fontWeight="700">
          <textPath href="#sealpath" startOffset="1%">
            TWENTY YEARS · AT THE CHECKPOINT ·
          </textPath>
        </text>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size * 0.24, color: num, lineHeight: 1 }}>20</span>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: size * 0.055, letterSpacing: "0.2em", textTransform: "uppercase", color: lbl, marginTop: 2 }}>Years</span>
      </div>
    </div>
  );
}

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

function Buy({ children, className = "", sub }: { children: React.ReactNode; className?: string; sub?: string }) {
  return (
    <a href={STRIPE_BUY_URL} target="_blank" rel="noopener noreferrer" className={`btn btn-shine ${className}`}>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
        <span>{children}</span>
        {sub ? <span className="sub">{sub}</span> : null}
      </span>
    </a>
  );
}

function CountUp({ to, prefix = "", suffix = "", decimals = 0, plus = false }: { to: number; prefix?: string; suffix?: string; decimals?: number; plus?: boolean }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !done.current) {
            done.current = true;
            const dur = 1500;
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              setV(to * eased);
              if (p < 1) requestAnimationFrame(tick);
              else setV(to);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  const display = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString();
  return <span ref={ref} suppressHydrationWarning>{prefix}{display}{plus ? "+" : ""}{suffix}</span>;
}

const MARQUEE_ITEMS = [
  "Catch price drops after you book",
  "Claim the refunds you're owed",
  "Skip the junk bag fees",
  "Free seats & upgrades",
  "Lounge access without status",
  "Beat the airport markup",
  "Book at the right time",
  "Search smarter, pay less",
];

/* ---------- hooks ---------- */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            (en.target as HTMLElement).classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function useCountdown() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      let s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      s %= 3600;
      const m = String(Math.floor(s / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setT(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* =================================================================== */
export default function Page() {
  useReveal();
  const countdown = useCountdown();
  const [open, setOpen] = useState<number | null>(0);
  const [barShow, setBarShow] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setBarShow(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ANNOUNCEMENT */}
      <div className="topbar">
        <span className="dot" />
        <span>
          Launch offer · <b>{PRICE.discountPct}% off</b> ends in{" "}
          <b suppressHydrationWarning>{countdown ?? "23:59:59"}</b>
        </span>
      </div>

      {/* HEADER */}
      <header className="head">
        <div className="wrap row">
          <div className="brand">
            <span className="seal-sm"><Seal size={30} onDark={false} /></span>
            Airport Patricia
          </div>
          <a href={STRIPE_BUY_URL} target="_blank" rel="noopener noreferrer" className="hbtn">
            Get the book <span className="price">{PRICE.currency}{PRICE.current}</span>
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero section" ref={heroRef}>
        <div className="aurora a1" />
        <div className="aurora a2" />
        <div className="wrap grid">
          <div>
            <div className="herotrust reveal in">
              <span className="rate"><span className="s">★★★★★</span> {PRODUCT.rating}</span>
              <span className="sep" />
              <span><b>{PRODUCT.travelers}</b> travelers helped</span>
              <span className="sep" />
              <span><b>20 yrs</b> at the checkpoint</span>
            </div>
            <h1 className="reveal in">
              You&rsquo;re losing hundreds at the airport <span className="em-brass">without even knowing it.</span>
            </h1>
            <p className="lede reveal in">
              Twenty years at the checkpoint taught me exactly where your money leaks. These are the
              10 hacks I&rsquo;d give my own niece. The ones airlines and hotels <b>hope you never figure out</b>.
            </p>

            <div className="hchips reveal in">
              <span className="chip"><span className="d" /> Catch price drops</span>
              <span className="chip"><span className="d" /> Claim refunds you&rsquo;re owed</span>
              <span className="chip"><span className="d" /> Skip junk fees</span>
            </div>

            <div className="pricebar reveal in">
              <span className="now"><sup>{PRICE.currency}</sup>{PRICE.current}</span>
              <span className="was">{PRICE.currency}{PRICE.anchor}</span>
              <span className="off">{PRICE.discountPct}% off today</span>
            </div>

            <div className="ctarow reveal in">
              <Buy className="btn-lg btn-glow" sub="Instant PDF · read it in 20 minutes">Get instant access</Buy>
            </div>

            <div className="trust reveal in">
              <span><Check /> Instant download</span>
              <span><Check /> 30-day guarantee</span>
              <span><Check /> Secure checkout</span>
            </div>
          </div>

          <div className="art reveal in">
            <img className="photo" src="/img/patricia-book-hero.jpg" alt="Patricia holding her Top 10 Travel Hacks book at the airport checkpoint" />
            <div className="seal-float"><Seal size={78} onDark /></div>
            <div className="tag">
              <span className="big">{PRODUCT.pages}</span>
              <span className="lbl">pages of<br />insider hacks</span>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="track">
          <div className="seq">{MARQUEE_ITEMS.map((m, i) => <span key={i}>{m}</span>)}</div>
          <div className="seq">{MARQUEE_ITEMS.map((m, i) => <span key={`b${i}`}>{m}</span>)}</div>
        </div>
      </div>

      {/* PROOF STRIP */}
      <section className="proof section" style={{ paddingBlock: "2.4rem" }}>
        <div className="wrap">
          <div className="row reveal" style={{ display: "flex", justifyContent: "center", gap: "clamp(1.5rem,6vw,4.5rem)", flexWrap: "wrap", width: "100%" }}>
            <div className="stat"><div className="n"><CountUp to={2000} plus /></div><div className="l">Travelers helped</div></div>
            <div className="stat"><div className="n"><CountUp to={20} suffix=" yrs" /></div><div className="l">At the checkpoint</div></div>
            <div className="stat"><div className="n">★ <CountUp to={4.98} decimals={2} /></div><div className="l">Average rating</div></div>
            <div className="stat"><div className="n"><CountUp to={9.99} prefix="$" decimals={2} /></div><div className="l">One-time, no subscription</div></div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section">
        <div className="wrap">
          <div className="shead reveal">
            <span className="kicker">The quiet tax on every trip</span>
            <h2>You&rsquo;re paying more than you have to, every single flight.</h2>
            <p>Not because you&rsquo;re careless. Because the whole system is built so you don&rsquo;t notice.</p>
          </div>
          <div className="pains">
            {[
              ["The price drops after you buy", "Fares and rooms move all day. When yours drops, the airline just keeps the difference."],
              ["You take the voucher", "When a flight is cancelled, most people accept credit when they&rsquo;re owed cash back."],
              ["You buy coverage twice", "The trip and bag protection already in your wallet sits unused while you pay for more."],
              ["You overpay at every step", "Bag fees, seat fees, seven-dollar water. Small leaks that add up to real money."],
            ].map(([t, d], i) => (
              <div className="pain reveal" key={i} style={{ transitionDelay: `${i * 60}ms` }}>
                <span className="x">✕</span>
                <p><b>{t}.</b> <span dangerouslySetInnerHTML={{ __html: d }} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEET PATRICIA */}
      <section className="meet section deep">
        <div className="wrap grid">
          <img className="photo reveal" src="/img/patricia-authority.jpg" alt="Patricia Simmons, airport security officer of twenty years" />
          <div className="reveal">
            <span className="kicker" style={{ color: "var(--brass-bright)" }}>Meet your guide</span>
            <blockquote style={{ marginTop: "1rem" }}>
              &ldquo;I&rsquo;ve watched a few million people travel the hard way. I&rsquo;m finally
              writing down what I&rsquo;d tell my own niece before she flies.&rdquo;
            </blockquote>
            <div className="who">
              <b>Patricia Simmons</b>
              <span>Airport Security Officer · 20 years</span>
            </div>
            <div className="creds">
              <div><div className="n">20</div><div className="l">Years on the job</div></div>
              <div><div className="n">Millions</div><div className="l">Of travelers watched</div></div>
              <div><div className="n">Zero</div><div className="l">Fluff or filler</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section className="section">
        <div className="wrap">
          <div className="shead reveal">
            <span className="kicker">What&rsquo;s inside</span>
            <h2>Ten hacks across three parts of every trip.</h2>
            <p>No vague advice you could get anywhere. The specific moves that keep money in your pocket, written out step by step.</p>
          </div>
          <div className="buckets">
            {SECTIONS.map((s, i) => (
              <div className="bucket reveal" key={s.n} style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="n">{s.n}</span>
                <span className="count">{s.count}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <p className="locknote reveal">The full ten, with the exact step-by-step on each, are waiting inside the guide.</p>
          <div className="bonus reveal">
            <span className="badge">Free bonus</span>
            <p><b>The Pre-Flight Checklist.</b> Every hack distilled into a one-page tear-out you save to your phone and run before each trip.</p>
          </div>
        </div>
      </section>

      {/* BOOK PREVIEW */}
      <section className="preview section deep">
        <div className="wrap">
          <div className="shead reveal">
            <span className="kicker" style={{ color: "var(--brass-bright)" }}>A real look inside</span>
            <h2>Beautifully made. Built to actually use.</h2>
          </div>
          <div className="stage reveal">
            <img className="pg tilt-l" src="/img/page-contents-04.png" alt="Contents page" />
            <img className="pg lead" src="/img/cover-flat.jpg" alt="Book cover" />
            <img className="pg tilt-r" src="/img/page-checklist-18.png" alt="Pre-flight checklist page" />
          </div>
        </div>
      </section>

      {/* OFFER / VALUE STACK */}
      <section className="section">
        <div className="wrap">
          <div className="shead reveal">
            <span className="kicker">The offer</span>
            <h2>Everything you get today</h2>
          </div>
          <div className="offer reveal">
            <div className="top">
              <span className="kicker">Patricia&rsquo;s Top 10 Travel Hacks</span>
              <h3>The complete guide</h3>
            </div>
            <div className="body">
              <div className="line"><span><span className="check"><Check /></span> The full 20-page guide (10 hacks)</span><span className="v">{PRICE.currency}19</span></div>
              <div className="line"><span><span className="check"><Check /></span> The Pre-Flight Checklist tear-out</span><span className="v">{PRICE.currency}9</span></div>
              <div className="line"><span><span className="check"><Check /></span> Free future updates, forever</span><span className="v">Included</span></div>
              <div className="line"><span><span className="check"><Check /></span> Instant delivery, no subscription</span><span className="v">Included</span></div>
              <div className="total">
                <span className="lbl">Today&rsquo;s price</span>
                <span className="amt"><span className="was">{PRICE.currency}28</span><span className="now">{PRICE.currency}{PRICE.current}</span></span>
              </div>
              <div className="cta"><Buy className="btn-block btn-lg btn-glow" sub="Secure checkout · instant access">Get the book now</Buy></div>
              <p className="micro">One-time payment · Backed by our 30-day guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ background: "var(--cream-2)" }}>
        <div className="wrap">
          <div className="shead reveal">
            <span className="kicker">Real travelers</span>
            <h2>It pays for itself on the next trip.</h2>
          </div>
          <div className="tcards">
            {TESTIMONIALS.map((t, i) => (
              <div className="tcard reveal" key={i} style={{ transitionDelay: `${(i % 2) * 70}ms` }}>
                <div className="s">{"★".repeat(t.stars)}</div>
                <p>&ldquo;{t.text}&rdquo;</p>
                <div className="who"><b>{t.name}</b> <span>· {t.tag}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="section deep">
        <div className="wrap guarantee reveal">
          <div className="seal-g"><Seal size={110} onDark /></div>
          <span className="kicker" style={{ color: "var(--brass-bright)" }}>Risk-free</span>
          <h2 style={{ marginTop: "0.6rem" }}>Try it for 30 days.</h2>
          <p>
            Read every page, use the hacks on your next trip, and see the savings for yourself.
            If the guide genuinely doesn&rsquo;t deliver, our 30-day satisfaction guarantee has you covered.
          </p>
          <p className="fine">
            Guarantee terms: refund requests must be submitted in writing within 30 days of purchase to our support address,
            and must include your order number, proof of purchase, and a detailed written explanation of the specific hacks
            you applied and the documented outcomes demonstrating the guide did not perform as described. Because this is a
            digital product delivered in full at the time of purchase, requests that do not include the required documentation,
            requests citing change of mind, accidental purchase, or failure to apply the material, and requests submitted after
            the 30-day window or following any redistribution of the file, are not eligible. Approved refunds are issued to the
            original payment method only and may take up to 30 business days to process. Submitting a request does not guarantee approval.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="wrap">
          <div className="shead reveal">
            <span className="kicker">Questions</span>
            <h2>Before you grab it</h2>
          </div>
          <div className="faq reveal">
            {FAQ.map((f, i) => (
              <div className="qa" key={i} data-open={open === i}>
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  {f.q}<span className="ic">+</span>
                </button>
                <div className="ans"><div><p>{f.a}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final section dark">
        <div className="wrap reveal">
          <span className="kicker" style={{ color: "var(--brass-bright)" }}>Last call</span>
          <h2 style={{ marginTop: "0.8rem" }}>Stop leaving your money at the airport.</h2>
          <p className="lede">
            Twenty years of insider hacks, yours in the next two minutes. One smart move on your
            next trip and this pays for itself many times over.
          </p>
          <div className="pricebar">
            <span className="now"><sup>{PRICE.currency}</sup>{PRICE.current}</span>
            <span className="was">{PRICE.currency}{PRICE.anchor}</span>
            <span className="off">{PRICE.discountPct}% off today</span>
          </div>
          <div className="cta"><Buy className="btn-lg btn-glow" sub="Instant PDF · 30-day guarantee">Get instant access</Buy></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div className="wrap">
          <div className="row">
            <div className="brand" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span className="seal-sm"><Seal size={28} onDark /></span> Airport Patricia
            </div>
            <div className="links">
              <a href="#">Contact</a>
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">Refunds</a>
            </div>
          </div>
          <div className="fine">
            © {new Date().getFullYear()} Airport Patricia. All rights reserved. &ldquo;Patricia Simmons&rdquo; is a travel-education
            persona. This guide provides general travel and money-saving information for educational purposes only and is not
            financial, legal, or travel-agency advice; results vary by traveler, route, fare type, and timing, and no specific
            savings are guaranteed. Airline, hotel, and credit-card policies change and are outside our control. Not affiliated
            with, endorsed by, or sponsored by any airline, airport, hotel, the TSA, or any government agency. By purchasing you
            agree to our Terms and the guarantee conditions stated above.
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE BUY BAR */}
      <div className={`buybar ${barShow ? "show" : ""}`}>
        <div className="px">
          <div className="l">{PRICE.discountPct}% off today</div>
          <span className="now">{PRICE.currency}{PRICE.current}</span>
          <span className="was">{PRICE.currency}{PRICE.anchor}</span>
        </div>
        <a href={STRIPE_BUY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-shine">Get the book</a>
      </div>
    </>
  );
}
