import type { Metadata } from "next";
import { Fraunces, Newsreader, Archivo } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://airportpatriciabook.vercel.app"),
  title: "Patricia's Insider Travel Playbook · Stop Leaving Money at the Airport",
  description:
    "Twenty years in travel, written down. Ten insider plays the airlines and airports hope you never learn. Instant PDF, $9.99 today.",
  openGraph: {
    title: "Patricia's Insider Travel Playbook",
    description:
      "Twenty years in travel, written down. The stuff they hope you never figure out.",
    images: ["/img/patricia-book-hero.jpg"],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${archivo.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
