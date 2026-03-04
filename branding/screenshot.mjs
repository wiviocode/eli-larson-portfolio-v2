import puppeteer from "puppeteer";
import { resolve, join } from "path";
import { fileURLToPath } from "url";

const dir = resolve(fileURLToPath(import.meta.url), "..");
const browser = await puppeteer.launch({ headless: true });

async function screenshotElements(file, selector, names) {
  const page = await browser.newPage();
  const url = `file://${join(dir, file)}`;
  // Set a large viewport so elements render at full size
  await page.setViewport({ width: 3000, height: 10000, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });

  const elements = await page.$$(selector);
  for (let i = 0; i < elements.length; i++) {
    const name = names[i] || `${file.replace(".html", "")}-${i}`;
    const outPath = join(dir, `${name}.png`);
    await elements[i].screenshot({ path: outPath });
    const box = await elements[i].boundingBox();
    console.log(`✓ ${name}.png (${Math.round(box.width)}x${Math.round(box.height)})`);
  }
  await page.close();
}

// Social banners — each banner individually
await screenshotElements("social-banners.html", ".linkedin-banner, .twitter-banner, .ig-highlight", [
  "linkedin-banner",
  "twitter-banner",
  "instagram-highlight",
]);

// LinkedIn carousel — each slide individually
await screenshotElements("linkedin-carousel.html", ".slide", [
  "carousel-1-cover",
  "carousel-2-homepage",
  "carousel-3-about",
  "carousel-4-cta",
]);

// Business card — front and back
await screenshotElements("business-card.html", ".card", [
  "card-front",
  "card-back",
]);

// Brand guide — full page
{
  const page = await browser.newPage();
  const url = `file://${join(dir, "brand-guide.html")}`;
  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
  const { width, height } = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
  await page.screenshot({ path: join(dir, "brand-guide.png"), fullPage: true });
  console.log(`✓ brand-guide.png (${width}x${height})`);
  await page.close();
}

// Email signature
{
  const page = await browser.newPage();
  await page.setViewport({ width: 700, height: 600, deviceScaleFactor: 2 });
  await page.goto(`file://${join(dir, "email-signature.html")}`, {
    waitUntil: "networkidle0",
    timeout: 15000,
  });
  const { height } = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
  }));
  await page.setViewport({ width: 700, height, deviceScaleFactor: 2 });
  await page.screenshot({ path: join(dir, "email-signature.png"), fullPage: true });
  console.log(`✓ email-signature.png (700x${height})`);
  await page.close();
}

await browser.close();
console.log("\nDone — individual PNGs saved to branding/");
