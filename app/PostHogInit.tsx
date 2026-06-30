"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

let inited = false;

// Initializes PostHog (autocapture for clicks/heatmaps + manual pageviews).
// No-op when NEXT_PUBLIC_POSTHOG_KEY isn't set, so the site works without it.
export default function PostHogInit() {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || inited) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "always",
    });
    inited = true;
  }, []);

  useEffect(() => {
    if (inited) posthog.capture("$pageview");
  }, [pathname]);

  return null;
}

export function phCapture(event: string, props?: Record<string, unknown>) {
  try {
    if ((posthog as unknown as { __loaded?: boolean }).__loaded) {
      posthog.capture(event, props);
    }
  } catch {
    /* ignore */
  }
}
