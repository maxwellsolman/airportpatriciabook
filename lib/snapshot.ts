import { put, list } from "@vercel/blob";

// Daily snapshot (KPIs + AI takeaways) written by the 5am cron and read by the
// dashboard. Stored in Vercel Blob; degrades to null when Blob isn't set up yet.

const KEY = "dashboard/latest.json";

export type Snapshot = {
  generatedAt: string;
  window: string;
  current: Record<string, number>;
  previous: Record<string, number>;
  topSources: { label: string; visitors: number }[];
  takeaways: string;
};

export async function saveSnapshot(data: Snapshot): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(KEY, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export async function readSnapshot(): Promise<Snapshot | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: KEY });
    const b = blobs.find((x) => x.pathname === KEY);
    if (!b) return null;
    const r = await fetch(b.url, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as Snapshot;
  } catch {
    return null;
  }
}
