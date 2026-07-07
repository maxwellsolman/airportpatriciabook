import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { posthogConfigured } from "@/lib/posthog";
import { DashShell } from "../shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics · Airport Patricia",
  robots: { index: false, follow: false },
};

function token(): string {
  const pw = process.env.DASHBOARD_PASSWORD || "Repriced1!";
  return crypto.createHash("sha256").update("apb|" + pw).digest("hex");
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  if (store.get("apb_dash")?.value !== token()) {
    redirect("/dashboard/login?next=/dashboard");
  }

  const apiHost = process.env.POSTHOG_API_HOST || "https://us.posthog.com";
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const posthogUrl = projectId ? `${apiHost}/project/${projectId}` : apiHost;

  return (
    <DashShell posthogUrl={posthogUrl} configured={posthogConfigured()}>
      {children}
    </DashShell>
  );
}
