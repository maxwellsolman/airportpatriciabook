import Stripe from "stripe";

// Real money, straight from Stripe. Used by the dashboard as the source of
// truth for revenue and order count when STRIPE_SECRET_KEY is set. If it's
// not set, the dashboard falls back to the behavioral estimate (purchases × price).

export type StripeRevenue = {
  configured: boolean;
  revenue: number; // net dollars kept: gross paid minus refunds (Stripe fees not deducted)
  gross: number; // gross dollars from succeeded charges
  refunded: number; // dollars refunded
  orders: number; // count of succeeded (paid) charges
  refundCount: number; // count of charges with any refund
  error?: string;
};

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;
function getClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

// Small in-process TTL cache. Warm serverless instances reuse module scope, so
// rapid range-toggling and tab revisits hit this instead of the Stripe API.
const TTL = 60_000;
const CACHE = new Map<string, { t: number; v: unknown }>();
async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = CACHE.get(key);
  const now = Date.now();
  if (hit && now - hit.t < TTL) return hit.v as T;
  const v = await fn();
  CACHE.set(key, { t: now, v });
  return v;
}

// Convert "YYYY-MM-DD HH:MM:SS" (UTC) -> unix seconds, honoring the go-live floor.
function windowSeconds(from: string, to: string): { gte: number; lte: number } | null {
  const start = process.env.ANALYTICS_START;
  const fromEff = start && start > from ? start : from;
  const gte = Math.floor(Date.parse(fromEff.replace(" ", "T") + "Z") / 1000);
  const lte = Math.floor(Date.parse(to.replace(" ", "T") + "Z") / 1000);
  if (!Number.isFinite(gte) || !Number.isFinite(lte)) return null;
  return { gte, lte };
}

// Drain an auto-paginating Stripe list into an array, with a hard safety cap.
async function collectAll<T>(pager: AsyncIterable<T>, cap: number): Promise<T[]> {
  const arr: T[] = [];
  for await (const x of pager) {
    arr.push(x);
    if (arr.length >= cap) break;
  }
  return arr;
}

// The two creator sites share ONE Stripe account. When STRIPE_PAYMENT_LINK is
// set, restrict revenue to charges that came through THIS site's payment link,
// so each dashboard shows only its own brand. Returns the set of matching
// payment_intent ids, or null to count everything (unset = legacy behavior).
const PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK;

async function allowedIntents(
  stripe: Stripe,
  created: { gte: number; lte: number },
): Promise<Set<string> | null> {
  if (!PAYMENT_LINK) return null;
  const sessions = await collectAll(
    stripe.checkout.sessions.list({ created, limit: 100 }),
    5000,
  ).catch(() => [] as Stripe.Checkout.Session[]);
  const set = new Set<string>();
  for (const s of sessions) {
    if (s.payment_link !== PAYMENT_LINK) continue;
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    if (pi) set.add(pi);
  }
  return set;
}

// ---- Detailed per-transaction view for the Payments tab ----

export type StripeTxn = {
  id: string;
  created: string; // ISO
  email: string;
  name: string;
  gross: number; // amount charged (dollars)
  fee: number; // Stripe processing fee (dollars)
  net: number; // gross - fee (from the balance transaction)
  tax: number; // tax collected, if Stripe Tax is on (else 0)
  refunded: number; // dollars refunded on this charge
  currency: string; // e.g. "USD"
  brand: string; // card brand, title-cased
  last4: string;
  country: string; // 2-letter country of the card
  status: string; // Paid / Partial refund / Refunded / Disputed / Failed
  receiptUrl: string;
};

export type StripeDetails = {
  configured: boolean;
  error?: string;
  summary: {
    gross: number;
    fees: number;
    net: number; // gross - fees
    tax: number;
    refunded: number;
    netAfterRefunds: number; // gross - fees - refunds
    orders: number;
    avgOrder: number;
    refundCount: number;
    refundRate: number; // refunded orders / orders
    disputeCount: number;
    disputeAmount: number;
    feeRate: number; // fees / gross
    newCustomers: number; // first-time emails in range
    repeatCustomers: number; // emails that bought more than once in range
  };
  byBrand: { label: string; count: number; amount: number }[];
  byCountry: { label: string; count: number; amount: number }[];
  balance: { available: number; pending: number } | null;
  txns: StripeTxn[];
};

const title = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "";

const emptyDetails = (): StripeDetails => ({
  configured: false,
  summary: {
    gross: 0, fees: 0, net: 0, tax: 0, refunded: 0, netAfterRefunds: 0,
    orders: 0, avgOrder: 0, refundCount: 0, refundRate: 0,
    disputeCount: 0, disputeAmount: 0, feeRate: 0,
    newCustomers: 0, repeatCustomers: 0,
  },
  byBrand: [],
  byCountry: [],
  balance: null,
  txns: [],
});

export function getStripeDetails(from: string, to: string): Promise<StripeDetails> {
  return cached(`det:${from}:${to}`, () => computeDetails(from, to));
}

async function computeDetails(from: string, to: string): Promise<StripeDetails> {
  const out = emptyDetails();
  const stripe = getClient();
  if (!stripe) return out;
  out.configured = true;

  const win = windowSeconds(from, to);
  if (!win) {
    out.error = "bad_range";
    return out;
  }
  const created = { gte: win.gte, lte: win.lte };

  // Fetch the two big lists + balance concurrently instead of one after another.
  let charges: Stripe.Charge[];
  let sessions: Stripe.Checkout.Session[];
  let bal: Stripe.Balance | null;
  try {
    [charges, sessions, bal] = await Promise.all([
      collectAll(stripe.charges.list({ created, limit: 100, expand: ["data.balance_transaction"] }), 5000),
      // Checkout sessions give us tax (Stripe Tax) + a reliable customer email.
      collectAll(stripe.checkout.sessions.list({ created, limit: 100 }), 5000).catch(
        () => [] as Stripe.Checkout.Session[],
      ),
      stripe.balance.retrieve().catch(() => null),
    ]);
  } catch (e) {
    out.error = (e as Error).message;
    return out;
  }

  const allow = PAYMENT_LINK
    ? new Set(
        sessions
          .filter((s) => s.payment_link === PAYMENT_LINK)
          .map((s) => (typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id))
          .filter((x): x is string => !!x),
      )
    : null;

  const enrich = new Map<string, { tax: number; email: string; name: string }>();
  for (const s of sessions) {
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    if (!pi) continue;
    enrich.set(pi, {
      tax: (s.total_details?.amount_tax ?? 0) / 100,
      email: s.customer_details?.email ?? "",
      name: s.customer_details?.name ?? "",
    });
  }

  const brand = new Map<string, { count: number; amount: number }>();
  const country = new Map<string, { count: number; amount: number }>();
  const emailCounts = new Map<string, number>();
  let grossCents = 0, feeCents = 0, taxCents = 0, refundCents = 0;

  for (const ch of charges) {
    if (ch.status !== "succeeded" || !ch.paid) continue;
    if (allow) {
      const cpi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
      if (!cpi || !allow.has(cpi)) continue;
    }

    const bt = ch.balance_transaction;
    const feeC = bt && typeof bt !== "string" ? bt.fee : 0;
    const netC = bt && typeof bt !== "string" ? bt.net : ch.amount - feeC;

    const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
    const ex = pi ? enrich.get(pi) : undefined;
    const card = ch.payment_method_details?.card;

    grossCents += ch.amount;
    feeCents += feeC;
    refundCents += ch.amount_refunded;
    const txTax = ex?.tax ?? 0;
    taxCents += Math.round(txTax * 100);

    if (ch.disputed) {
      out.summary.disputeCount += 1;
      out.summary.disputeAmount += ch.amount / 100;
    }
    if (ch.amount_refunded > 0) out.summary.refundCount += 1;

    const email = (ex?.email || ch.billing_details?.email || ch.receipt_email || "").toLowerCase();
    if (email) emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);

    const b = title(card?.brand ?? "other");
    const cc = (card?.country ?? "??").toUpperCase();
    const bAgg = brand.get(b) ?? { count: 0, amount: 0 };
    bAgg.count += 1; bAgg.amount += ch.amount / 100; brand.set(b, bAgg);
    const cAgg = country.get(cc) ?? { count: 0, amount: 0 };
    cAgg.count += 1; cAgg.amount += ch.amount / 100; country.set(cc, cAgg);

    const status = ch.disputed
      ? "Disputed"
      : ch.refunded
        ? "Refunded"
        : ch.amount_refunded > 0
          ? "Partial refund"
          : "Paid";

    // Cap the row list so the payload stays light; summary counts everything.
    if (out.txns.length < 250) {
      out.txns.push({
        id: ch.id,
        created: new Date(ch.created * 1000).toISOString(),
        email: ex?.email || ch.billing_details?.email || ch.receipt_email || "",
        name: ex?.name || ch.billing_details?.name || "",
        gross: ch.amount / 100,
        fee: feeC / 100,
        net: netC / 100,
        tax: txTax,
        refunded: ch.amount_refunded / 100,
        currency: (ch.currency ?? "usd").toUpperCase(),
        brand: b,
        last4: card?.last4 ?? "",
        country: cc,
        status,
        receiptUrl: ch.receipt_url ?? "",
      });
    }
    out.summary.orders += 1;
  }

  for (const c of emailCounts.values()) {
    if (c > 1) out.summary.repeatCustomers += 1;
    else out.summary.newCustomers += 1;
  }

  out.summary.gross = grossCents / 100;
  out.summary.fees = feeCents / 100;
  out.summary.tax = taxCents / 100;
  out.summary.refunded = refundCents / 100;
  out.summary.net = out.summary.gross - out.summary.fees;
  out.summary.netAfterRefunds = out.summary.gross - out.summary.fees - out.summary.refunded;
  out.summary.avgOrder = out.summary.orders ? out.summary.gross / out.summary.orders : 0;
  out.summary.refundRate = out.summary.orders ? out.summary.refundCount / out.summary.orders : 0;
  out.summary.feeRate = out.summary.gross ? out.summary.fees / out.summary.gross : 0;

  out.byBrand = [...brand.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.amount - a.amount);
  out.byCountry = [...country.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  if (bal) {
    const sum = (arr: { amount: number; currency: string }[]) =>
      arr.filter((a) => a.currency === "usd").reduce((s, a) => s + a.amount, 0) / 100;
    out.balance = { available: sum(bal.available), pending: sum(bal.pending) };
  }

  return out;
}

// `from`/`to` are "YYYY-MM-DD HH:MM:SS" in UTC (same shape metrics.ts uses).
export function getStripeRevenue(from: string, to: string): Promise<StripeRevenue> {
  return cached(`rev:${from}:${to}`, () => computeRevenue(from, to));
}

async function computeRevenue(from: string, to: string): Promise<StripeRevenue> {
  const base: StripeRevenue = {
    configured: false,
    revenue: 0,
    gross: 0,
    refunded: 0,
    orders: 0,
    refundCount: 0,
  };
  const stripe = getClient();
  if (!stripe) return base;
  base.configured = true;

  const win = windowSeconds(from, to);
  if (!win) {
    base.error = "bad_range";
    return base;
  }

  try {
    const allow = await allowedIntents(stripe, { gte: win.gte, lte: win.lte });
    let grossCents = 0;
    let refundedCents = 0;
    for await (const ch of stripe.charges.list({ created: { gte: win.gte, lte: win.lte }, limit: 100 })) {
      if (ch.status !== "succeeded" || !ch.paid) continue;
      if (allow) {
        const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
        if (!pi || !allow.has(pi)) continue;
      }
      base.orders += 1;
      grossCents += ch.amount;
      if (ch.amount_refunded > 0) {
        refundedCents += ch.amount_refunded;
        base.refundCount += 1;
      }
    }
    base.gross = grossCents / 100;
    base.refunded = refundedCents / 100;
    base.revenue = base.gross - base.refunded;
  } catch (e) {
    base.error = (e as Error).message;
  }
  return base;
}
