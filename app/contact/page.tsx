import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/config";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Contact · Patricia's Insider Travel Playbook",
  robots: { index: true, follow: true },
};

export default function Contact() {
  return (
    <LegalShell title="Contact">
      <p>
        Questions about your order, a refund, or the Guide itself? We&rsquo;re happy to help.
      </p>
      <p style={{ marginTop: "1.2rem" }}>
        Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ fontWeight: 700 }}>
          {SUPPORT_EMAIL}
        </a>{" "}
        and we&rsquo;ll get back to you as soon as we can, usually within one to two business days.
      </p>
      <p style={{ marginTop: "1.2rem" }}>
        If you&rsquo;ve already purchased, please include your order number so we can find it quickly.
      </p>
    </LegalShell>
  );
}
