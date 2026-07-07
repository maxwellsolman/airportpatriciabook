import { hogql, posthogConfigured } from "./posthog";
import { getStripeRevenue, type StripeRevenue } from "./stripe";

// Each metric is computed independently and guarded, so one failing query
// never blanks the whole dashboard. `from`/`to` are "YYYY-MM-DD HH:MM:SS" (UTC).

export type Metrics = {
  configured: boolean;
  range: { from: string; to: string };
  visitors: number;
  pageviews: number;
  checkoutClicks: number;
  purchases: number;
  stripe: StripeRevenue; // real revenue/orders from Stripe (configured flag inside)
  avgSeconds: number;
  conversionRate: number; // purchases / visitors
  clickRate: number; // checkoutClicks / visitors
  checkoutCompletion: number; // purchases / checkoutClicks
  sources: { label: string; visitors: number }[];
  pages: { path: string; views: number; visitors: number }[];
  devices: { label: string; visitors: number }[];
  trend: { day: string; visitors: number; pageviews: number }[];
  trendUnit: "day" | "hour";
  error?: string;
};

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getMetrics(from: string, to: string): Promise<Metrics> {
  const base: Metrics = {
    configured: posthogConfigured(),
    range: { from, to },
    visitors: 0,
    pageviews: 0,
    checkoutClicks: 0,
    purchases: 0,
    stripe: { configured: false, revenue: 0, gross: 0, refunded: 0, orders: 0, refundCount: 0 },
    avgSeconds: 0,
    conversionRate: 0,
    clickRate: 0,
    checkoutCompletion: 0,
    sources: [],
    pages: [],
    devices: [],
    trend: [],
    trendUnit: "day",
  };
  // Real revenue from Stripe — runs regardless of whether PostHog is set up.
  base.stripe = await safe(() => getStripeRevenue(from, to), base.stripe);

  if (!base.configured) {
    // No PostHog, but still surface real Stripe orders as the purchase count.
    if (base.stripe.configured) base.purchases = base.stripe.orders;
    return base;
  }

  const singleDay = from.slice(0, 10) === to.slice(0, 10);
  base.trendUnit = singleDay ? "hour" : "day";

  // Hard "analytics start" floor — ignore everything before go-live (clears test data).
  const start = process.env.ANALYTICS_START;
  const fromEff = start && start > from ? start : from;
  const WIN = `timestamp >= toDateTime('${fromEff}') AND timestamp <= toDateTime('${to}')`;
  // Exclude the private admin dashboard from the marketing-site metrics.
  const ADMIN = `AND properties.$pathname NOT LIKE '/dashboard%'`;

  // Run all PostHog queries concurrently — they are independent, so firing
  // them in parallel cuts dashboard latency from ~8 sequential round-trips to
  // roughly one.
  const [totals, clicks, purch, dur, sources, pages, devices, trend] = await Promise.all([
    safe(
      () =>
        hogql(
          `SELECT count() AS pv, count(distinct person_id) AS visitors
           FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}`,
        ),
      [] as unknown[],
    ),
    safe(
      () => hogql(`SELECT count() FROM events WHERE event = 'checkout_click' AND ${WIN}`),
      [] as unknown[],
    ),
    safe(
      () => hogql(`SELECT count() FROM events WHERE event = 'purchase' AND ${WIN}`),
      [] as unknown[],
    ),
    safe(
      () =>
        hogql(
          `SELECT round(avg(d)) FROM (
             SELECT dateDiff('second', min(timestamp), max(timestamp)) AS d
             FROM events WHERE ${WIN} ${ADMIN} AND properties.$session_id IS NOT NULL
             GROUP BY properties.$session_id
             HAVING d BETWEEN 0 AND 3600
           )`,
        ),
      [] as unknown[],
    ),
    safe(
      () =>
        hogql(
          `SELECT coalesce(nullIf(properties.$referring_domain, ''), '$direct') AS src,
                  count(distinct person_id) AS v
           FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
           GROUP BY src ORDER BY v DESC LIMIT 8`,
        ),
      [] as unknown[],
    ),
    safe(
      () =>
        hogql(
          `SELECT properties.$pathname AS path, count() AS views, count(distinct person_id) AS visitors
           FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
           GROUP BY path ORDER BY views DESC LIMIT 10`,
        ),
      [] as unknown[],
    ),
    safe(
      () =>
        hogql(
          `SELECT coalesce(nullIf(properties.$device_type, ''), 'Unknown') AS d,
                  count(distinct person_id) AS v
           FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
           GROUP BY d ORDER BY v DESC`,
        ),
      [] as unknown[],
    ),
    safe(
      () =>
        hogql(
          singleDay
            ? `SELECT toHour(timestamp) AS bucket, count(distinct person_id) AS visitors, count() AS pv
               FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
               GROUP BY bucket ORDER BY bucket`
            : `SELECT toDate(timestamp) AS bucket, count(distinct person_id) AS visitors, count() AS pv
               FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
               GROUP BY bucket ORDER BY bucket`,
        ),
      [] as unknown[],
    ),
  ]);

  if (Array.isArray(totals[0])) {
    base.pageviews = n((totals[0] as unknown[])[0]);
    base.visitors = n((totals[0] as unknown[])[1]);
  }
  base.checkoutClicks = Array.isArray(clicks[0]) ? n((clicks[0] as unknown[])[0]) : 0;
  base.purchases = Array.isArray(purch[0]) ? n((purch[0] as unknown[])[0]) : 0;
  base.avgSeconds = Array.isArray(dur[0]) ? n((dur[0] as unknown[])[0]) : 0;
  base.sources = sources.map((r) => {
    const row = r as unknown[];
    const label = String(row[0] ?? "$direct");
    return { label: label === "$direct" ? "Direct / none" : label, visitors: n(row[1]) };
  });
  base.pages = pages.map((r) => {
    const row = r as unknown[];
    return { path: String(row[0] ?? "/"), views: n(row[1]), visitors: n(row[2]) };
  });
  base.devices = devices.map((r) => {
    const row = r as unknown[];
    return { label: String(row[0] ?? "Unknown"), visitors: n(row[1]) };
  });
  base.trend = trend.map((r) => {
    const row = r as unknown[];
    return { day: String(row[0] ?? ""), visitors: n(row[1]), pageviews: n(row[2]) };
  });

  // When Stripe is connected its real order count is the source of truth for
  // sales (the behavioral 'purchase' event can be blocked by ad blockers / iOS).
  if (base.stripe.configured) base.purchases = base.stripe.orders;

  base.clickRate = base.visitors ? base.checkoutClicks / base.visitors : 0;
  base.conversionRate = base.visitors ? base.purchases / base.visitors : 0;
  base.checkoutCompletion = base.checkoutClicks ? base.purchases / base.checkoutClicks : 0;

  return base;
}
