import { NextResponse } from "next/server";
import { getStripeDetails } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Accepts ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive). Proxy enforces auth.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromDay = (searchParams.get("from") || "").slice(0, 10);
  const toDay = (searchParams.get("to") || "").slice(0, 10);

  const valid = /^\d{4}-\d{2}-\d{2}$/;
  if (!valid.test(fromDay) || !valid.test(toDay)) {
    return NextResponse.json({ error: "bad_range" }, { status: 400 });
  }

  try {
    const details = await getStripeDetails(`${fromDay} 00:00:00`, `${toDay} 23:59:59`);
    return NextResponse.json(details);
  } catch (e) {
    return NextResponse.json(
      { error: "query_failed", message: (e as Error).message },
      { status: 500 },
    );
  }
}
