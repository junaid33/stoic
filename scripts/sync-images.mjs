// Uploads each catalog product's main photo (read from the live storefront) into STOIC's Openfront
// as a ProductImage. Openship needs a product image to import an order (LineItem.image is required).
// Idempotent: products that already have an image are skipped.   node scripts/sync-images.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readEnv, root } from "./env.mjs";
const env = readEnv();
const catalog = JSON.parse(readFileSync(resolve(root, "catalog.json"), "utf8"));
const store = (process.env.STOREFRONT_URL || "https://storefront-production-f608.up.railway.app").replace(/\/+$/, "");
const url = env.STOIC_OPENFRONT_URL + "/api/graphql";
const gql = async (query, token, variables = {}) => {
  const j = await (await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ query, variables }) })).json();
  if (j.errors?.length) throw new Error(j.errors[0].message);
  return j.data;
};
const token = (await gql(`mutation($e:String!,$p:String!){authenticateUserWithPassword(email:$e,password:$p){... on UserAuthenticationWithPasswordSuccess{sessionToken}}}`, null, { e: env.STOIC_OPENFRONT_EMAIL, p: env.STOIC_OPENFRONT_PASSWORD })).authenticateUserWithPassword.sessionToken;
for (const p of catalog.products) {
  const found = (await gql(`query($h:String!){ products(where:{handle:{equals:$h}}, take:1){ id productImages{ id } } }`, token, { h: p.handle })).products[0];
  if (!found) { console.log("missing product", p.handle); continue; }
  if (found.productImages.length) { console.log("has image", p.handle); continue; }
  const res = await fetch(store + p.image);
  if (!res.ok) { console.log("photo not reachable", p.image, res.status); continue; }
  const form = new FormData();
  form.append("operations", JSON.stringify({ query: `mutation($data: ProductImageCreateInput!){ createProductImage(data:$data){ id } }`, variables: { data: { image: { upload: null }, altText: p.title, products: { connect: [{ id: found.id }] } } } }));
  form.append("map", JSON.stringify({ 0: ["variables.data.image.upload"] }));
  form.append("0", new Blob([await res.arrayBuffer()], { type: res.headers.get("content-type") || "image/webp" }), p.image.split("/").pop());
  const r = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + token, "apollo-require-preflight": "true" }, body: form });
  const j = await r.json();
  console.log(j.errors?.length ? "FAILED " + p.handle + ": " + j.errors[0].message : "uploaded " + p.handle);
}
