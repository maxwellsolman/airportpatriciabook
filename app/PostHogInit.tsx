"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

let inited = false;

// PostHog init using the official `defaults` flag, which enables automatic
// pageview capture (initial + SPA history changes) and autocapture/heatmaps.
// No-op when NEXT_PUBLIC_POSTHOG_KEY isn't set.
export default function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || inited) return;
    // Don't track the private admin dashboard.
    if (window.location.pathname.startsWith("/dashboard")) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      defaults: "2026-05-30",
      person_profiles: "always",
    });
    inited = true;
  }, []);

  return null;
}

export function phCapture(event: string, props?: Record<string, unknown>) {
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}
