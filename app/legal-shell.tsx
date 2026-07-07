import Link from "next/link";

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legalwrap">
      <header className="legalhead">
        <Link href="/" className="legalbrand">Airport Patricia</Link>
        <Link href="/" className="legalback">← Back to site</Link>
      </header>
      <div className="legal">
        <h1>{title}</h1>
        {updated ? <p className="legalupdated">Last updated {updated}</p> : null}
        {children}
      </div>
      <footer className="legalfoot">
        <div className="legallinks">
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refunds">Refunds</Link>
        </div>
        <p>© 2026 Airport Patricia. &ldquo;Patricia Simmons&rdquo; is a travel-education persona. Not affiliated with any airline, airport, hotel, the TSA, or any government agency.</p>
      </footer>
    </main>
  );
}
