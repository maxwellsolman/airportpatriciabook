const { chromium } = require("playwright-core");
const EXEC = "/Users/user/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
(async () => {
  const b = await chromium.launch({ executablePath: EXEC, headless: true, args: ["--no-sandbox"] });
  const d = await b.newPage({ viewport: { width: 1280, height: 850 }, deviceScaleFactor: 1 });
  await d.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await d.evaluate(() => document.querySelectorAll(".reveal").forEach(e => e.classList.add("in")));
  await d.evaluate(() => window.scrollTo(0, 430)); await d.waitForTimeout(1700);
  await d.screenshot({ path: "shots/audit/marquee-proof.png" });
  await d.close();
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
  await m.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await m.evaluate(() => document.querySelectorAll(".reveal").forEach(e => e.classList.add("in")));
  await m.waitForTimeout(400);
  const el = await m.$(".hero"); await el.screenshot({ path: "shots/audit/m-hero2.png" });
  await b.close(); console.log("ok");
})();
