import { hogql, posthogConfigured } from "./posthog";

// Each metric is computed independently and guarded, so one failing query
// never blanks the whole dashboard. `from`/`to` are "YYYY-MM-DD HH:MM:SS" (UTC).

export type Metrics = {
  configured: boolean;
  range: { from: string; to: string };
  visitors: number;
  pageviews: number;
  checkoutClicks: number;
  purchases: number;
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
  if (!base.configured) return base;

  const singleDay = from.slice(0, 10) === to.slice(0, 10);
  base.trendUnit = singleDay ? "hour" : "day";

  const WIN = `timestamp >= toDateTime('${from}') AND timestamp <= toDateTime('${to}')`;
  // Exclude the private admin dashboard from the marketing-site metrics.
  const ADMIN = `AND properties.$pathname NOT LIKE '/dashboard%'`;

  // 1. visitors + pageviews
  const totals = await safe(
    () =>
      hogql(
        `SELECT count() AS pv, count(distinct person_id) AS visitors
         FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}`,
      ),
    [] as unknown[],
  );
  if (Array.isArray(totals[0])) {
    base.pageviews = n((totals[0] as unknown[])[0]);
    base.visitors = n((totals[0] as unknown[])[1]);
  }

  // 2. checkout clicks
  const clicks = await safe(
    () => hogql(`SELECT count() FROM events WHERE event = 'checkout_click' AND ${WIN}`),
    [] as unknown[],
  );
  base.checkoutClicks = Array.isArray(clicks[0]) ? n((clicks[0] as unknown[])[0]) : 0;

  // 3. purchases — only the gated 'purchase' event (fired solely on real
  // post-Stripe visits), so self-visits to /thank-you never count as sales.
  const purch = await safe(
    () => hogql(`SELECT count() FROM events WHERE event = 'purchase' AND ${WIN}`),
    [] as unknown[],
  );
  base.purchases = Array.isArray(purch[0]) ? n((purch[0] as unknown[])[0]) : 0;

  // 4. avg time on site (per-session span, capped to filter outliers)
  const dur = await safe(
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
  );
  base.avgSeconds = Array.isArray(dur[0]) ? n((dur[0] as unknown[])[0]) : 0;

  // 5. sources
  const sources = await safe(
    () =>
      hogql(
        `SELECT coalesce(nullIf(properties.$referring_domain, ''), '$direct') AS src,
                count(distinct person_id) AS v
         FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
         GROUP BY src ORDER BY v DESC LIMIT 8`,
      ),
    [] as unknown[],
  );
  base.sources = sources.map((r) => {
    const row = r as unknown[];
    const label = String(row[0] ?? "$direct");
    return { label: label === "$direct" ? "Direct / none" : label, visitors: n(row[1]) };
  });

  // 6. top pages
  const pages = await safe(
    () =>
      hogql(
        `SELECT properties.$pathname AS path, count() AS views, count(distinct person_id) AS visitors
         FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
         GROUP BY path ORDER BY views DESC LIMIT 10`,
      ),
    [] as unknown[],
  );
  base.pages = pages.map((r) => {
    const row = r as unknown[];
    return { path: String(row[0] ?? "/"), views: n(row[1]), visitors: n(row[2]) };
  });

  // 7. devices
  const devices = await safe(
    () =>
      hogql(
        `SELECT coalesce(nullIf(properties.$device_type, ''), 'Unknown') AS d,
                count(distinct person_id) AS v
         FROM events WHERE event = '$pageview' AND ${WIN} ${ADMIN}
         GROUP BY d ORDER BY v DESC`,
      ),
    [] as unknown[],
  );
  base.devices = devices.map((r) => {
    const row = r as unknown[];
    return { label: String(row[0] ?? "Unknown"), visitors: n(row[1]) };
  });

  // 8. trend — hourly for a single day, daily otherwise
  const trend = await safe(
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
  );
  base.trend = trend.map((r) => {
    const row = r as unknown[];
    return { day: String(row[0] ?? ""), visitors: n(row[1]), pageviews: n(row[2]) };
  });

  base.clickRate = base.visitors ? base.checkoutClicks / base.visitors : 0;
  base.conversionRate = base.visitors ? base.purchases / base.visitors : 0;
  base.checkoutCompletion = base.checkoutClicks ? base.purchases / base.checkoutClicks : 0;

  return base;
}
