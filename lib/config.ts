// ===================================================================
//  SITE CONFIG — edit these values to update the page.
//  >>> STRIPE: when your account is ready, paste your Payment Link / Buy
//      Button URL into STRIPE_BUY_URL below. That's the only change needed.
// ===================================================================

export const STRIPE_BUY_URL =
  "https://buy.stripe.com/test_PLACEHOLDER_REPLACE_ME"; // <-- replace with your Stripe Payment Link

export const PRICE = {
  current: "9.99",
  anchor: "19",
  currency: "$",
  discountPct: 47,
};

export const PRODUCT = {
  name: "Patricia's Top 10 Travel Hacks",
  format: "Instant PDF · 20 pages",
  pages: 20,
  rating: 4.9,
  reviews: 2147,
  travelers: "2,000+",
};

export const HACKS = [
  { n: "01", t: "The price drop nobody tells you about", d: "Fares and rooms keep moving after you pay. How to track yours and claw back the difference." },
  { n: "02", t: "The refund the airline owes you", d: "Cash, not a voucher. The rules nobody reads, and how to actually collect." },
  { n: "03", t: "Coverage you already paid for", d: "The trip, bag, and rental protection hiding in your credit card. Stop double-buying." },
  { n: "04", t: "When to actually book", d: "The Tuesday myth, busted. The real cheapest windows for domestic and international." },
  { n: "05", t: "Beat the bag fees", d: "The carry-on and personal-item play, from someone who watches people overpack all day." },
  { n: "06", t: "Free seats and the upgrade game", d: "Skip the seat fees that are just fear with a price tag, and get a real shot up front." },
  { n: "07", t: "Lounge comfort without the status", d: "More ways through that door than you think, even without first class." },
  { n: "08", t: "Get through my line faster", d: "Pack the bin and stage your stuff the way that gets you through in half the time." },
  { n: "09", t: "Dodge the airport markup", d: "Beat the seven-dollar water and the eighteen-dollar sandwich without going hungry." },
  { n: "10", t: "Search smarter and pay less", d: "The multi-city and one-way tricks most travelers get wrong, costing them every trip." },
];

export const FAQ = [
  { q: "What exactly do I get?", a: "A 20-page premium PDF guide with all ten hacks written in Patricia's voice, plus a one-page Pre-Flight Checklist you can save to your phone. You get it instantly after checkout." },
  { q: "How do I read it?", a: "It's a standard PDF. Open it on your phone, tablet, or computer, or print it. No app, no account, no subscription." },
  { q: "Is this a subscription?", a: "No. It's a one-time payment of $9.99. You own the guide forever and get any future updates to it free." },
  { q: "Who is this for?", a: "Anyone who flies, from once a year to once a week. If you book travel, you're almost certainly leaving money on the table that these hacks help you keep." },
  { q: "Will these hacks really save me money?", a: "Most travelers make back the $9.99 on their very next trip with a single hack. Hack number one alone has caught hundreds of dollars in price drops people never knew existed." },
  { q: "Can I get a refund?", a: "Yes, we offer a 30-day satisfaction guarantee. See the guarantee terms below for how it works." },
];

export const TESTIMONIALS = [
  { name: "Marcus T.", tag: "Flies 6x a year", text: "Used hack #1 on a Cancun trip and the price dropped $214 a week after I booked. I got it back. This paid for itself a hundred times over.", stars: 5 },
  { name: "Dani R.", tag: "Family of four", text: "The bag-fee and seat chapters alone saved us almost $200 on one vacation. Patricia tells it straight, no fluff.", stars: 5 },
  { name: "Priya S.", tag: "Business traveler", text: "I thought I already knew all the tricks. I was wrong. The refund chapter got me a cash refund I would've taken as a voucher.", stars: 5 },
  { name: "Greg H.", tag: "Twice-a-year flyer", text: "Read it in 20 minutes on my phone at the gate. Wish I'd had this years ago. The checklist lives on my home screen now.", stars: 5 },
];
