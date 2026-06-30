"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { phCapture } from "../PostHogInit";

// Fires once on the thank-you page = a completed purchase signal.
export default function Track() {
  useEffect(() => {
    track("purchase");
    phCapture("purchase");
  }, []);
  return null;
}
