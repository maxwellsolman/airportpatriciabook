import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/config";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy · Patricia's Insider Travel Playbook",
  robots: { index: true, follow: true },
};

export default function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="July 7, 2026">
      <p>
        This policy explains what information we collect when you visit this website or buy Patricia&rsquo;s Insider
        Travel Playbook, and how we use it. We keep this deliberately short and plain.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Purchase information.</b> When you buy, our payment processor (Stripe) collects your email and payment details to process the transaction. We receive a record of the purchase and your email, but never your full card number.</li>
        <li><b>Analytics.</b> We use privacy-conscious analytics to understand how the site is used (for example, page views and general traffic sources). This helps us improve the page.</li>
        <li><b>Advertising pixels.</b> If we run ads, we may use conversion pixels (such as the Meta pixel) to measure whether an ad led to a purchase. These may set cookies.</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use this information to deliver your purchase, provide support, measure and improve the website, and measure
        advertising performance. We do not sell your personal information.
      </p>

      <h2>Third parties</h2>
      <p>
        We share data only with the service providers that make the site work, including Stripe (payments), our hosting
        and analytics providers, and, where applicable, advertising platforms for conversion measurement. Each handles
        data under its own privacy policy.
      </p>

      <h2>Cookies</h2>
      <p>
        The site may use cookies for analytics and, if ads are running, for conversion measurement. You can control
        cookies through your browser settings.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us to access or delete the personal information we hold about you (for example, your purchase
        record) by emailing us. We will respond within a reasonable time.
      </p>

      <h2>AI-generated persona and content</h2>
      <p>
        &ldquo;Patricia Simmons&rdquo; is a fictional, AI-generated persona. The name, likeness, images, and any voice
        associated with her are computer-generated and do not depict, represent, or record a real person, a real
        airport security officer, or any TSA or government employee. Content on this site and in the Guide is produced
        with the assistance of artificial intelligence and is intended as general travel education. Any resemblance to
        actual individuals, living or dead, is coincidental. References to industry experience are part of the
        persona&rsquo;s narrative framing, not claims about a specific real employee.
      </p>

      <h2>No warranty and your responsibility</h2>
      <p>
        All content is provided <b>&ldquo;as is,&rdquo;</b> for general informational and educational purposes only,
        without warranties of any kind, express or implied. It is not financial, legal, or travel-agency advice.
        We do not promise or guarantee any particular savings, outcome, or result; those depend on factors outside
        our control, including airline, hotel, and credit-card policies, fare types, availability, timing, and your
        own decisions. You use the information at your own discretion and risk and are solely responsible for your
        travel and purchasing choices. To the fullest extent permitted by law, we disclaim all liability for any loss
        or damage arising from reliance on the content, and any liability is limited as described in our{" "}
        <a href="/terms">Terms</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or requests? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
