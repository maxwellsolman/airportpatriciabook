import { NextResponse } from "next/server";
import crypto from "node:crypto";

const COOKIE = "apb_dash";
const PASSWORD = process.env.DASHBOARD_PASSWORD || "Repriced1!";

function token(): string {
  return crypto.createHash("sha256").update("apb|" + PASSWORD).digest("hex");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (body.password !== PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
