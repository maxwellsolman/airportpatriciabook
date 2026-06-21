const { chromium } = require("playwright-core");
const EXEC = "/Users/user/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
(async () => {
  const b = await chromium.launch({ executablePath: EXEC, headless: true, args: ["--no-sandbox"] });
  const d = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await d.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await d.evaluate(() => document.querySelectorAll(".reveal").forEach(e => e.classList.add("in")));
  await d.waitForTimeout(500);
  for (const [sel, name] of [[".foot",".foot"],[".bonus",".bonus"],[".meet .creds",".creds"],[".offer .micro",".micro"]]) {
    const el = await d.$(sel); if (el) await el.screenshot({ path: `shots/audit/d-${name.replace(/\W/g,'')}.png` });
  }
  await d.close();
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
  await m.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await m.evaluate(() => document.querySelectorAll(".reveal").forEach(e => e.classList.add("in")));
  await m.waitForTimeout(400);
  for (const [sel, name] of [[".hero",".hero"],[".pains",".pains"],[".offer",".offer"]]) {
    const el = await m.$(sel); if (el) await el.screenshot({ path: `shots/audit/m-${name.replace(/\W/g,'')}.png` });
  }
  await b.close(); console.log("ok");
})();
