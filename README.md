# Airport Patricia — Sales Landing Page

Single-page VSL-style site that sells **Patricia's Top 10 Travel Hacks** PDF for **$9.99** (anchored at $19, 47% off).

- **Live:** https://airportpatriciabook.vercel.app
- **Repo:** https://github.com/maxwellsolman/airportpatriciabook
- **Stack:** Next.js 16 (App Router) + Tailwind v4, deployed on Vercel.

## ⚠️ Plug in Stripe (the only thing left to do)
Everything is wired to a placeholder. When your Stripe account is ready:

1. Create a **Payment Link** (or Buy Button) in Stripe for the $9.99 product.
2. Open **`lib/config.ts`** and paste the URL into `STRIPE_BUY_URL`.
3. Commit + push — Vercel auto-deploys. Every "Buy" button on the page uses that one link.

## Editing content
All copy, prices, the 10 hacks, FAQ, and testimonials live in **`lib/config.ts`**.
- Prices/discount: `PRICE`
- The 10 hacks: `HACKS`
- FAQ: `FAQ`
- **Testimonials (`TESTIMONIALS`) are placeholders — replace with real reviews before scaling traffic.**

## Design
Matches the book: navy `#0e2138`, cream `#f5efe3`, brass `#c19a52`; Fraunces / Newsreader / Archivo. Images in `public/img/` (Higgsfield shots of Patricia + book, plus PDF page previews).

Sections: announcement bar w/ countdown → hero → proof strip → problem → meet Patricia → 10 hacks → book preview → offer/value stack → testimonials → 30-day guarantee (with strict fine print) → FAQ → final CTA → footer. Sticky mobile buy bar, scroll reveals, FAQ accordion.

## Dev
```
npm run dev      # local at :3000
npm run build    # production build
```
`shoot.js` / `shoot2.js` are local Playwright screenshot helpers (gitignored).

## Notes / disclaimers
"Patricia Simmons" is a travel-education persona. Footer carries an educational-purposes + not-affiliated disclaimer, and the guarantee section's fine print intentionally sets strict, documented refund conditions.
