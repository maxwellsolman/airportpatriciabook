import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/config";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Refund Policy · Patricia's Insider Travel Playbook",
  robots: { index: true, follow: true },
};

export default function Refunds() {
  return (
    <LegalShell title="Refund Policy" updated="July 7, 2026">
      <p>
        We want you to be happy with the Guide. This page explains our 30-day satisfaction guarantee and how to request
        a refund.
      </p>

      <h2>30-day satisfaction guarantee</h2>
      <p>
        Read every page, use the plays on your next trip, and see for yourself. If the Guide genuinely doesn&rsquo;t
        deliver, you may request a refund within 30 days of purchase.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> within 30 days of purchase with your order number
        and proof of purchase. Because this is a digital product delivered in full at the time of purchase, we ask that
        your request briefly describe which plays you applied so we can improve the Guide.
      </p>

      <h2>What is eligible</h2>
      <p>
        Approved refunds are issued to your original payment method and may take up to 30 business days to process.
        Requests submitted after the 30-day window, or following redistribution of the file, are not eligible.
        Submitting a request does not by itself guarantee approval, but we review every one in good faith.
      </p>

      <h2>Questions</h2>
      <p>
        Anything unclear? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we&rsquo;ll help.
      </p>
    </LegalShell>
  );
}
