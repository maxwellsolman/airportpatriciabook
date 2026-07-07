import type { Metadata } from "next";
import { SUPPORT_EMAIL, PRICE } from "@/lib/config";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service · Patricia's Insider Travel Playbook",
  robots: { index: true, follow: true },
};

export default function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="July 7, 2026">
      <p>
        These terms govern your purchase and use of Patricia&rsquo;s Insider Travel Playbook (the &ldquo;Guide&rdquo;),
        a digital product sold through this website. By purchasing or downloading the Guide, you agree to these terms.
        If you do not agree, please do not purchase.
      </p>

      <h2>What you are buying</h2>
      <p>
        The Guide is a downloadable PDF delivered instantly after a successful payment of {PRICE.currency}{PRICE.current}.
        It is a one-time purchase with no subscription. You receive the file for your own personal, non-commercial use,
        plus any future updates we make to it.
      </p>

      <h2>License and permitted use</h2>
      <p>
        We grant you a personal, non-transferable, non-exclusive license to read and use the Guide. You may not resell,
        redistribute, republish, share, or post the file or its contents publicly, in whole or in part, without written
        permission. All content remains our intellectual property.
      </p>

      <h2>Educational content, not professional advice</h2>
      <p>
        The Guide provides general travel and money-saving information for educational purposes only. It is not
        financial, legal, or travel-agency advice. Results vary by traveler, route, fare type, and timing, and no
        specific savings are guaranteed. Airline, hotel, and credit-card policies change and are outside our control.
        You are responsible for your own travel and purchasing decisions.
      </p>

      <h2>Persona disclosure</h2>
      <p>
        &ldquo;Patricia Simmons&rdquo; is a travel-education persona used to present this content. She is a fictional,
        AI-generated character and is not a real person, a real airport security officer, or a TSA or government
        employee. We are not affiliated with, endorsed by, or sponsored by any airline, airport, hotel, the TSA, or any
        government agency. Any third-party services mentioned in the Guide are separate services referenced only as
        helpful resources.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are processed securely by Stripe. We do not receive or store your full card details. Applicable taxes
        may be added at checkout.
      </p>

      <h2>Refunds</h2>
      <p>
        Purchases are covered by our refund policy. Please see the <a href="/refunds">Refunds</a> page for the full terms.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential
        damages arising from your use of the Guide. Our total liability for any claim is limited to the amount you paid
        for the Guide.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the website or the Guide after changes take effect
        constitutes acceptance of the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
