// Places a Stripe TEST-mode order (card 4242) through the live STOIC storefront as a
// realistic buyer on a phone, then prints the Openfront order id.
//   node scripts/buyer.mjs [product-handle] [colour] [size]
// Needs playwright (npm i playwright; npx playwright install chromium).
import { chromium, devices } from "playwright";

const store = (process.env.STOREFRONT_URL || "https://storefront-production-f608.up.railway.app").replace(/\/+$/, "");
const [handle = "virtue-tee", colour = "Bone", size = "M"] = process.argv.slice(2);
const shots = process.env.SHOTS;
const browser = await chromium.launch();
const page = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(`${store}/products/${handle}`);
  await page.getByRole("button", { name: colour, exact: true }).tap();
  await page.getByRole("button", { name: size, exact: true }).tap();
  await page.getByRole("button", { name: /Add to bag/ }).tap();
  await page.getByText("Added to your bag.").first().waitFor();
  await page.goto(store + "/checkout");
  await page.getByLabel("Email address").fill("claire.dubois@gmail.com");
  await page.getByLabel("First name").fill("Claire");
  await page.getByLabel("Last name").fill("Dubois");
  await page.getByLabel("Address", { exact: true }).fill("2210 Fillmore Street");
  await page.getByLabel("City").fill("San Francisco");
  await page.locator("select[name=province]").selectOption("CA");
  await page.getByLabel("ZIP code").fill("94115");
  await page.getByLabel("Phone (optional)").fill("4155550142");
  await page.getByRole("button", { name: /continue/i }).first().tap();
  await page.getByText(/Preparing secure payment/).waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
  const frame = page.frameLocator("iframe[name^=__privateStripeFrame]").first();
  const cardTab = frame.getByRole("button", { name: /^Card/ });
  if (await cardTab.count()) await cardTab.first().click();
  await frame.getByPlaceholder("1234 1234 1234 1234").fill("4242424242424242");
  await frame.getByPlaceholder("MM / YY").fill("1234");
  await frame.getByPlaceholder(/CVC|CVV/i).fill("123");
  const zip = frame.getByPlaceholder("12345");
  if (await zip.count()) await zip.fill("94115");
  if (shots) await page.screenshot({ path: shots + "/checkout-402.png", fullPage: true });
  await page.getByRole("button", { name: /^Pay/ }).tap();
  await page.waitForURL("**/order/**", { timeout: 90000 });
  if (shots) await page.screenshot({ path: shots + "/order-confirmation-402.png", fullPage: true });
  console.log("ORDER", new URL(page.url()).pathname.split("/").pop());
} catch (e) {
  if (shots) await page.screenshot({ path: shots + "/checkout-fail.png", fullPage: true }).catch(() => {});
  console.log("FAILED", e.message.split("\n")[0], "| at", page.url());
} finally {
  if (errors.length) console.log("Browser errors:", errors);
  await browser.close();
}
