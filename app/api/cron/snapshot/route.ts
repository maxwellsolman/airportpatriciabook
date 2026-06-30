import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getMetrics, type Metrics } from "@/lib/metrics";
import { saveSnapshot, type Snapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function dayUTC(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function kpis(m: Metrics): Record<string, number> {
  return {
    visitors: m.visitors,
    pageviews: m.pageviews,
    checkoutClicks: m.checkoutClicks,
    purchases: m.purchases,
    avgSeconds: m.avgSeconds,
    conversionRate: Math.round(m.conversionRate * 1000) / 10,
    clickRate: Math.round(m.clickRate * 1000) / 10,
    checkoutCompletion: Math.round(m.checkoutCompletion * 1000) / 10,
  };
}

async function advise(current: Metrics, previous: Metrics): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "Add ANTHROPIC_API_KEY to enable daily AI takeaways. Until then, use the KPI cards and funnel below.";
  }
  const client = new Anthropic();
  const prompt = `You are the growth analyst for Airport Patricia, a $9.99 digital travel guide sold at patriciasguide.com. Below is the last 7 days of site analytics versus the previous 7 days.

THIS WEEK: ${JSON.stringify(kpis(current))}
LAST WEEK: ${JSON.stringify(kpis(previous))}
TOP SOURCES (this week): ${JSON.stringify(current.sources.slice(0, 5))}
TOP PAGES (this week): ${JSON.stringify(current.pages.slice(0, 5))}

The funnel is: visitor -> clicks a buy button (checkoutClicks) -> lands on the thank-you page (purchases). conversionRate is purchases per visitor; checkoutCompletion is purchases per checkout click.

Write a tight briefing the founders can read in 30 seconds. Use these three short sections with markdown headers exactly:
## What happened
2 to 3 sentences on the biggest week-over-week movements (traffic, sources, conversion). Lead with the number.
## Where we're losing people
1 to 2 sentences naming the weakest step in the funnel and the likely reason.
## Do this next
3 concrete, specific actions as a bullet list.

Rules: no em dashes, use contractions, be direct, no fluff, no preamble. If a number is zero because tracking just went live, say so plainly instead of inventing trends.`;

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1500,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function GET(req: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const current = await getMetrics(`${dayUTC(-7)} 00:00:00`, `${dayUTC(0)} 23:59:59`);
  const previous = await getMetrics(`${dayUTC(-14)} 00:00:00`, `${dayUTC(-8)} 23:59:59`);

  let takeaways = "";
  try {
    takeaways = await advise(current, previous);
  } catch (e) {
    takeaways = `AI takeaways could not be generated this run (${(e as Error).message}). KPIs below are still current.`;
  }

  const snapshot: Snapshot = {
    generatedAt: new Date().toISOString(),
    window: "Last 7 days vs previous 7 days",
    current: kpis(current),
    previous: kpis(previous),
    topSources: current.sources.slice(0, 5),
    takeaways,
  };

  try {
    await saveSnapshot(snapshot);
  } catch (e) {
    return NextResponse.json({ ok: false, stored: false, message: (e as Error).message, snapshot });
  }

  return NextResponse.json({ ok: true, stored: Boolean(process.env.BLOB_READ_WRITE_TOKEN), snapshot });
}
