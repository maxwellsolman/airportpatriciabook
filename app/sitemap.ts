import type { MetadataRoute } from "next";

const BASE = "https://patriciasguide.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/terms", "/privacy", "/refunds", "/contact"].map((path) => ({
    url: BASE + path,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.5,
  }));
}
