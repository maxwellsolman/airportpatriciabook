"use client";

import { useMemo, useState } from "react";
import type { StripeTxn } from "@/lib/stripe";
import { useDash, useTransactions } from "../../shell";
import { Bars, I, Stat, dateTime, fmt, money, pct, presetLabel } from "../../ui";

const PAGE_SIZE = 25;

function toCSV(rows: StripeTxn[]): string {
  const head = ["Date (UTC)", "Email", "Name", "Brand", "Last4", "Country", "Currency", "Gross", "Fee", "Tax", "Net", "Refunded", "Status", "Charge ID"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head.join(",")];
  for (const t of rows) {
    lines.push([
      new Date(t.created).toISOString(), t.email, t.name, t.brand, t.last4, t.country,
      t.currency, t.gross, t.fee, t.tax, t.net, t.refunded, t.status, t.id,
    ].map(esc).join(","));
  }
  return lines.join("\n");
}

export default function PaymentsPage() {
  const { configured: phConfigured, preset } = useDash();
  const { pay, err, loading } = useTransactions();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const stripeLive = !!pay?.configured;

  const filtered = useMemo(() => {
    const rows = pay?.txns ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) =>
      `${t.email} ${t.name} ${t.last4} ${t.brand} ${t.country} ${t.status}`.toLowerCase().includes(q),
    );
  }, [pay, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patriciasguide-transactions-${presetLabel(preset).toLowerCase().replace(/\s+/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", margin: "0.3rem 0 1.4rem" }}>
        <p className="dash-cardsub" style={{ marginTop: 0 }}>Live from Stripe · {presetLabel(preset)}</p>
        {pay?.balance && (
          <div style={{ display: "flex", gap: "1.4rem", fontSize: "0.82rem", color: "var(--d-soft)" }}>
            <span>Available <b className="dash-num" style={{ color: "var(--d-ink)" }}>{money(pay.balance.available)}</b></span>
            <span>Pending <b className="dash-num" style={{ color: "var(--d-ink)" }}>{money(pay.balance.pending)}</b></span>
          </div>
        )}
      </div>

      {!stripeLive && !loading ? (
        <div className="dash-card" style={{ padding: "1.6rem", color: "var(--d-soft)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Stripe isn&rsquo;t connected. Add <b className="dash-num">STRIPE_SECRET_KEY</b> in Vercel to see live payment detail here.
        </div>
      ) : err ? (
        <div className="dash-card" style={{ padding: "1.6rem", color: "var(--d-soft)", fontSize: "0.9rem" }}>Couldn&rsquo;t load payments: {err}</div>
      ) : (
        <>
          {/* summary cards */}
          <div className="dash-kpis">
            <Stat label="Gross volume" accent loading={!pay} value={money(pay?.summary.gross ?? 0)} hint={`${fmt(pay?.summary.orders ?? 0)} paid orders`} />
            <Stat label="Stripe fees" loading={!pay} value={money(pay?.summary.fees ?? 0)} hint={`${pct(pay?.summary.feeRate ?? 0)} effective`} />
            <Stat label="Net after fees" loading={!pay} value={money(pay?.summary.net ?? 0)} hint="gross minus fees" />
            <Stat label="Net revenue" accent loading={!pay} value={money(pay?.summary.netAfterRefunds ?? 0)} hint="after fees + refunds" />
            <Stat label="Tax collected" loading={!pay} value={money(pay?.summary.tax ?? 0)} hint={(pay?.summary.tax ?? 0) > 0 ? "via Stripe Tax" : "no tax configured"} />
            <Stat label="Refunds" loading={!pay} value={money(pay?.summary.refunded ?? 0)} hint={`${fmt(pay?.summary.refundCount ?? 0)} · ${pct(pay?.summary.refundRate ?? 0)}`} />
            <Stat label="Avg. order" loading={!pay} value={money(pay?.summary.avgOrder ?? 0)} hint="gross ÷ orders" />
            <Stat label="Disputes" loading={!pay} value={fmt(pay?.summary.disputeCount ?? 0)} hint={(pay?.summary.disputeCount ?? 0) > 0 ? money(pay?.summary.disputeAmount ?? 0) : "none — good"} />
            <Stat label="New customers" loading={!pay} value={fmt(pay?.summary.newCustomers ?? 0)} hint="first purchase" />
            <Stat label="Repeat buyers" loading={!pay} value={fmt(pay?.summary.repeatCustomers ?? 0)} hint="bought 2+ times" />
          </div>

          {/* breakdowns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem", marginTop: "1.1rem" }}>
            <div className="dash-card" style={{ padding: "1.15rem 1.25rem" }}>
              <div className="dash-label" style={{ marginBottom: "0.9rem" }}>By card brand</div>
              <Bars mono money max={pay?.byBrand[0]?.amount ?? 1} rows={(pay?.byBrand ?? []).map((b) => ({ label: `${b.label} · ${fmt(b.count)}`, value: b.amount }))} />
            </div>
            <div className="dash-card" style={{ padding: "1.15rem 1.25rem" }}>
              <div className="dash-label" style={{ marginBottom: "0.9rem" }}>By card country</div>
              <Bars mono money max={pay?.byCountry[0]?.amount ?? 1} rows={(pay?.byCountry ?? []).map((c) => ({ label: `${c.label} · ${fmt(c.count)}`, value: c.amount }))} />
            </div>
          </div>

          {/* transactions */}
          <div className="dash-card" style={{ padding: "1.15rem 1.25rem", marginTop: "1.1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div>
                <div className="dash-cardtitle">Transactions</div>
                <div className="dash-cardsub">{fmt(filtered.length)}{query ? " matching" : ""} in {presetLabel(preset)}{(pay?.txns.length ?? 0) >= 250 ? " (latest 250)" : ""}</div>
              </div>
              <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
                <div className="dash-searchbox">
                  {I.search({ width: 15, height: 15 })}
                  <input className="dash-input" placeholder="Search email, card, country…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
                </div>
                <button className="dash-btn" onClick={exportCSV} disabled={!filtered.length} title="Download CSV">{I.download({ width: 15, height: 15 })} CSV</button>
              </div>
            </div>

            {!pay ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="dash-skel" style={{ height: 38, borderRadius: 8 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ color: "var(--d-faint)", fontSize: "0.85rem", padding: "0.6rem 0" }}>
                {query ? "No transactions match your search." : "No payments in this range yet."}
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table className="dash-txn">
                    <thead>
                      <tr>
                        <th style={{ width: 24 }}></th>
                        <th>Date</th><th>Customer</th><th>Card</th>
                        <th style={{ textAlign: "right" }}>Gross</th>
                        <th style={{ textAlign: "right" }}>Fee</th>
                        <th style={{ textAlign: "right" }}>Tax</th>
                        <th style={{ textAlign: "right" }}>Net</th>
                        <th>Status</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((t) => {
                        const open = openRow === t.id;
                        return (
                          <TxnRow key={t.id} t={t} open={open} onToggle={() => setOpenRow(open ? null : t.id)} />
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pageCount > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", fontSize: "0.82rem", color: "var(--d-soft)" }}>
                    <span className="dash-num">{safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {fmt(filtered.length)}</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="dash-btn" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>Prev</button>
                      <span className="dash-num" style={{ alignSelf: "center" }}>{safePage + 1}/{pageCount}</span>
                      <button className="dash-btn" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1}>Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {pay?.error && <p style={{ color: "var(--d-faint)", fontSize: "0.76rem", marginTop: "0.9rem" }}>Note: {pay.error}</p>}
          </div>

          <p style={{ textAlign: "center", color: "var(--d-faint)", fontSize: "0.76rem", marginTop: "1.6rem", lineHeight: 1.65 }}>
            {phConfigured ? "" : ""}Figures pulled live from Stripe for the selected range. Fees are Stripe&rsquo;s processing fees; net revenue is gross minus fees and refunds. Full payout schedule lives in your Stripe dashboard.
          </p>
        </>
      )}
    </>
  );
}

function TxnRow({ t, open, onToggle }: { t: StripeTxn; open: boolean; onToggle: () => void }) {
  const pill = t.status === "Paid" ? "ok" : t.status === "Disputed" ? "bad" : "warn";
  return (
    <>
      <tr className="exp" onClick={onToggle}>
        <td style={{ color: "var(--d-faint)" }}>
          <span style={{ display: "inline-flex", transition: "transform .2s", transform: open ? "rotate(90deg)" : "none" }}>{I.arrow({ width: 13, height: 13 })}</span>
        </td>
        <td style={{ whiteSpace: "nowrap", color: "var(--d-soft)" }} title={new Date(t.created).toString()}>{dateTime(t.created)}</td>
        <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.email || t.name || <span style={{ color: "var(--d-faint)" }}>—</span>}</td>
        <td style={{ whiteSpace: "nowrap", color: "var(--d-soft)" }}>{t.brand}{t.last4 ? ` ••${t.last4}` : ""}{t.country && t.country !== "??" ? ` · ${t.country}` : ""}</td>
        <td className="dash-num" style={{ textAlign: "right" }}>{money(t.gross)}</td>
        <td className="dash-num" style={{ textAlign: "right", color: "var(--d-soft)" }}>{t.fee ? "-" + money(t.fee).slice(1) : "—"}</td>
        <td className="dash-num" style={{ textAlign: "right", color: "var(--d-soft)" }}>{t.tax ? money(t.tax) : "—"}</td>
        <td className="dash-num" style={{ textAlign: "right", fontWeight: 600 }}>{money(t.net)}</td>
        <td><span className={`dash-pill ${pill}`}>{t.status}</span></td>
        <td>{t.receiptUrl ? <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "var(--d-soft)", display: "inline-flex" }} title="View receipt">{I.external({ width: 15, height: 15 })}</a> : null}</td>
      </tr>
      {open && (
        <tr className="detail">
          <td colSpan={10}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.9rem 1.6rem", padding: "0.4rem 0.2rem 0.6rem" }}>
              <Detail label="Customer" value={t.name || t.email || "—"} />
              <Detail label="Email" value={t.email || "—"} />
              <Detail label="Card" value={`${t.brand} ••${t.last4 || "----"}`} />
              <Detail label="Card country" value={t.country === "??" ? "—" : t.country} />
              <Detail label="Gross" value={`${money(t.gross)} ${t.currency}`} />
              <Detail label="Tax" value={t.tax ? money(t.tax) : "—"} />
              <Detail label="Stripe fee" value={t.fee ? money(t.fee) : "—"} />
              <Detail label="Net" value={money(t.net)} />
              <Detail label="Refunded" value={t.refunded ? money(t.refunded) : "—"} />
              <Detail label="Status" value={t.status} />
              <Detail label="Charge ID" value={t.id} mono />
              {t.receiptUrl ? <Detail label="Receipt" value={<a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="dash-link">Open receipt {I.external({ width: 12, height: 12 })}</a>} /> : null}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="dash-label" style={{ marginBottom: 3 }}>{label}</div>
      <div className={mono ? "dash-num" : ""} style={{ fontSize: "0.84rem", color: "var(--d-ink)", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
