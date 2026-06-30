// Server-side PostHog HogQL query helper (uses the Personal API key).
// The public Project key (phc_...) is for ingestion only; reading data back
// requires a Personal API key (phx_...) + the numeric Project ID.

const API_HOST = process.env.POSTHOG_API_HOST || "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;

export function posthogConfigured(): boolean {
  return Boolean(PROJECT_ID && KEY);
}

export async function hogql(query: string): Promise<unknown[]> {
  if (!posthogConfigured()) throw new Error("posthog_not_configured");
  const res = await fetch(`${API_HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`posthog ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { results?: unknown[] };
  return data.results ?? [];
}
