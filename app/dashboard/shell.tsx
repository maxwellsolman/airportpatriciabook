"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Metrics } from "@/lib/metrics";
import type { StripeDetails } from "@/lib/stripe";
import { I, PRESETS, rangeFor } from "./ui";

/* ---------- shared context ---------- */
type DashCtx = {
  preset: string;
  setPreset: (k: string) => void;
  from: string;
  to: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
  posthogUrl: string;
  configured: boolean;
};
const Ctx = createContext<DashCtx | null>(null);

export function useDash(): DashCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDash must be used inside DashShell");
  return c;
}

const NAV = [
  { href: "/dashboard", label: "Overview", icon: I.overview },
  { href: "/dashboard/payments", label: "Payments", icon: I.card },
  { href: "/dashboard/funnel", label: "Funnel", icon: I.funnel },
  { href: "/dashboard/traffic", label: "Traffic", icon: I.traffic },
  { href: "/dashboard/behavior", label: "Behavior", icon: I.behavior },
];

export function DashShell({ posthogUrl, configured, children }: { posthogUrl: string; configured: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [preset, setPresetState] = useState("today");
  // Ref-counted so overlapping loads (a page fetching metrics + transactions at
  // once) keep the indicator up until the LAST one finishes.
  const [loadCount, setLoadCount] = useState(0);
  const setBusy = useCallback((b: boolean) => setLoadCount((c) => (b ? c + 1 : Math.max(0, c - 1))), []);
  const busy = loadCount > 0;

  // Persist the chosen range across page navigations + reloads.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("apb_range") : null;
    if (saved && PRESETS.some((p) => p.key === saved)) setPresetState(saved);
  }, []);
  const setPreset = useCallback((k: string) => {
    setPresetState(k);
    try { localStorage.setItem("apb_range", k); } catch {}
  }, []);

  const [from, to] = rangeFor(preset);
  const active = [...NAV].reverse().find((n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)));

  // On mobile the nav is a horizontal strip — keep the active item in view.
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1000) return;
    document.querySelector(".dash-navitem.on")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [pathname]);

  async function logout() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    router.replace("/dashboard/login");
  }

  return (
    <Ctx.Provider value={{ preset, setPreset, from, to, busy, setBusy, posthogUrl, configured }}>
      <div className="dash">
        <div className="dash-shell">
          <aside className="dash-side">
            <div className="dash-brand">
              <span className="mk">{I.brand({ width: 18, height: 18 })}</span>
              <span>
                <span className="nm" style={{ display: "block", color: "#fff" }}>Airport Patricia</span>
                <span className="sb">Analytics</span>
              </span>
            </div>
            <nav className="dash-nav">
              {NAV.map((n) => {
                const on = n === active;
                return (
                  <Link key={n.href} href={n.href} className={`dash-navitem${on ? " on" : ""}`} prefetch>
                    {n.icon({})}
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <span className="spacer" />
            <button className="dash-logout" onClick={logout}>{I.logout({})}Log out</button>
          </aside>

          <main className="dash-main">
            <div className={`dash-progress${busy ? " on" : ""}`} aria-hidden />
            <div className="dash-top d-rise">
              <div>
                <div className="crumb">Airport Patricia</div>
                <h1>{active?.label ?? "Overview"}</h1>
              </div>
              {pathname !== "/dashboard/behavior" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <span className="dash-sync" style={{ opacity: busy ? 1 : 0 }}>
                    <span className="dash-spinner" />
                    Updating
                  </span>
                  <div className="dash-dates">
                    {PRESETS.map((p) => (
                      <button key={p.key} className={`dash-datebtn${preset === p.key ? " on" : ""}`} onClick={() => setPreset(p.key)}>{p.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`dash-content${busy ? " loading" : ""}`}>{children}</div>
          </main>
        </div>
      </div>
    </Ctx.Provider>
  );
}

/* ---------- data hooks (shared across pages) ---------- */
export function useMetrics(): { data: Metrics | null; err: string | null } {
  const { from, to, setBusy } = useDash();
  const [data, setData] = useState<Metrics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setBusy(true);
    fetch(`/api/dashboard/metrics?from=${from}&to=${to}`, { cache: "no-store" })
      .then(async (r) => ({ ok: r.ok, j: await r.json() }))
      .then(({ ok, j }) => {
        if (!live) return;
        if (!ok) setErr(j.message || j.error || "Request failed");
        else { setData(j as Metrics); setErr(null); }
      })
      .catch((e) => live && setErr((e as Error).message))
      .finally(() => setBusy(false)); // always balance the setBusy(true) above
    return () => { live = false; };
  }, [from, to, setBusy]);
  return { data, err };
}

export function useTransactions(): { pay: StripeDetails | null; err: string | null; loading: boolean } {
  const { from, to, setBusy } = useDash();
  const [pay, setPay] = useState<StripeDetails | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setBusy(true);
    setLoading(true);
    fetch(`/api/dashboard/transactions?from=${from}&to=${to}`, { cache: "no-store" })
      .then(async (r) => ({ ok: r.ok, j: await r.json() }))
      .then(({ ok, j }) => {
        if (!live) return;
        if (!ok) setErr(j.message || j.error || "Request failed");
        else { setPay(j as StripeDetails); setErr(null); }
      })
      .catch((e) => live && setErr((e as Error).message))
      .finally(() => { setBusy(false); if (live) setLoading(false); }); // always balance setBusy(true)
    return () => { live = false; };
  }, [from, to, setBusy]);
  return { pay, err, loading };
}
