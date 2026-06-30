"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { phCapture } from "../PostHogInit";

// Only counts a purchase when the visitor actually arrived from Stripe checkout.
// A direct visit (you opening /thank-you yourself, a refresh, a bookmark) is
// ignored, so it never inflates the sales number.
export default function Track() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromStripe =
      params.has("session_id") || /(^|\.)stripe\.com/i.test(document.referrer || "");
    if (!fromStripe) return;
    track("purchase");
    phCapture("purchase");
  }, []);
  return null;
}
