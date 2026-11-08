// Seeds STOIC's Openfront: store, currency, US region, Stripe (pp_stripe_stripe) and
// manual fulfillment, flat shipping, categories and the catalog. Idempotent.
//   node scripts/setup.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readEnv, root } from "./env.mjs";

const env = readEnv();
const catalog = JSON.parse(readFileSync(resolve(root, "catalog.json"), "utf8"));
const { shop } = catalog;
let token = "";
const gql = async (query, variables = {}) => {
  const r = await fetch(env.STOIC_OPENFRONT_URL + "/api/graphql", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors?.length) throw new Error(j.errors[0].message);
  return j.data;
};
token = (await gql(`mutation($e:String!,$p:String!){authenticateUserWithPassword(email:$e,password:$p){... on UserAuthenticationWithPasswordSuccess{sessionToken}}}`, { e: env.STOIC_OPENFRONT_EMAIL, p: env.STOIC_OPENFRONT_PASSWORD })).authenticateUserWithPassword.sessionToken;

const plural = (l) => { const x = l[0].toLowerCase() + l.slice(1); return /[^aeiou]y$/.test(x) ? x.slice(0, -1) + "ies" : x + "s"; };
async function ensure(list, where, data) {
  const found = (await gql(`query($w:${list}WhereInput!){ items: ${plural(list)}(where:$w, take:1){ id } }`, { w: where })).items[0];
  if (found) return found.id;
  return (await gql(`mutation($d:${list}CreateInput!){ item: create${list}(data:$d){ id } }`, { d: data })).item.id;
}
if (!(await gql(`{ stores(take:1){ id } }`)).stores[0])
  await gql(`mutation($d:StoreCreateInput!){ createStore(data:$d){ id } }`, { d: { name: shop.name, defaultCurrencyCode: shop.currency, homepageTitle: shop.name, homepageDescription: shop.tagline } });
const currency = await ensure("Currency", { code: { equals: "usd" } }, { code: "usd", symbol: "$", symbolNative: "$", name: "US Dollar" });
const countries = [];
for (const c of shop.region.countries) countries.push(await ensure("Country", { iso2: { equals: c.iso2 } }, c));
const fn = (v) => ({ createPaymentFunction: v, capturePaymentFunction: v, refundPaymentFunction: v, getPaymentStatusFunction: v, generatePaymentLinkFunction: v, handleWebhookFunction: v });
const stripe = await ensure("PaymentProvider", { code: { equals: "pp_stripe_stripe" } }, { code: "pp_stripe_stripe", name: "Stripe", isInstalled: true, ...fn("stripe") });
const fulfil = await ensure("FulfillmentProvider", { code: { equals: "fp_manual" } }, { code: "fp_manual", name: "Manual fulfillment", isInstalled: true });
const region = await ensure("Region", { code: { equals: shop.region.code } }, {
  code: shop.region.code, name: shop.region.name, taxRate: shop.region.taxRate,
  currency: { connect: { id: currency } }, paymentProviders: { connect: [{ id: stripe }] },
  fulfillmentProviders: { connect: [{ id: fulfil }] }, countries: { connect: countries.map((id) => ({ id })) },
});
for (const o of shop.shipping)
  await ensure("ShippingOption", { uniqueKey: { equals: `${o.name}-${shop.region.code}` } }, {
    name: o.name, uniqueKey: `${o.name}-${shop.region.code}`, priceType: "flat_rate", amount: o.amount, isReturn: false,
    region: { connect: { id: region } }, fulfillmentProvider: { connect: { id: fulfil } },
  });
const cats = {};
for (const c of catalog.categories) cats[c.handle] = await ensure("ProductCategory", { handle: { equals: c.handle } }, { title: c.title, handle: c.handle, isActive: true });

const para = (t) => [{ type: "paragraph", children: [{ text: t }] }];
for (const p of catalog.products) {
  const found = (await gql(`query($h:String!){ products(where:{handle:{equals:$h}}, take:1){ id productOptions{ title productOptionValues{ id value } } productVariants{ sku } } }`, { h: p.handle })).products[0];
  let item = found;
  if (!item) {
    item = (await gql(`mutation($d:ProductCreateInput!){ createProduct(data:$d){ id productOptions{ title productOptionValues{ id value } } productVariants{ sku } } }`, { d: {
      title: p.title, handle: p.handle, description: para(p.description), status: "published", discountable: true,
      metadata: { stoic: { colours: p.colours, blurb: p.blurb, bullets: p.bullets, photos: p.photos } },
      productCategories: { connect: [{ id: cats[p.category] }] },
      productOptions: { create: p.options.map((title, k) => ({ title, productOptionValues: { create: [...new Set(p.variants.map((v) => v.options[k]))].map((value) => ({ value })) } })) },
    } })).createProduct;
    console.log("created", p.title);
  }
  const have = new Set(item.productVariants.map((v) => v.sku));
  for (const [rank, v] of p.variants.entries()) {
    if (have.has(v.sku)) continue;
    const ids = v.options.map((val, k) => item.productOptions.find((o) => o.title === p.options[k]).productOptionValues.find((x) => x.value === val).id);
    await gql(`mutation($d:ProductVariantCreateInput!){ createProductVariant(data:$d){ id } }`, { d: {
      title: v.title, sku: v.sku, variantRank: rank, manageInventory: false, allowBackorder: true, inventoryQuantity: 0,
      product: { connect: { id: item.id } }, productOptionValues: { connect: ids.map((id) => ({ id })) },
      prices: { create: [{ amount: v.price, currency: { connect: { id: currency } }, region: { connect: { id: region } } }] },
    } });
  }
}
const out = await gql(`{ products{ handle status productVariants{ id } } }`);
console.log(out.products.map((p) => `${p.handle}:${p.status}:${p.productVariants.length}`).join(" "));
