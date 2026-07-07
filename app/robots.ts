import type { MetadataRoute } from "next";

const BASE = "https://patriciasguide.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/thank-you", "/patricia-insider-travel-playbook.pdf"],
    },
    sitemap: BASE + "/sitemap.xml",
  };
}
