// Claims STOIC's Openship first admin (createInitialUser) for the owner's email; random
// password goes to .env.local (mode 0600), never printed.   node scripts/claim-openship.mjs
import { randomBytes } from "node:crypto";
import { appendFileSync, chmodSync } from "node:fs";
import { envPath, readEnv } from "./env.mjs";
const URL_ = "https://openship-production-f7b3.up.railway.app";
const OWNER = "junaidkabani3@gmail.com";
const env = readEnv();
if (!env.STOIC_OPENSHIP_PASSWORD) {
  const pw = randomBytes(24).toString("base64url");
  appendFileSync(envPath, `# STOIC Openship admin\nSTOIC_OPENSHIP_URL=${URL_}\nSTOIC_OPENSHIP_EMAIL=${OWNER}\nSTOIC_OPENSHIP_PASSWORD=${pw}\n`, { mode: 0o600 });
  chmodSync(envPath, 0o600);
  env.STOIC_OPENSHIP_PASSWORD = pw;
}
const r = await fetch(URL_ + "/api/graphql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
  query: `mutation($data: CreateInitialUserInput!){ createInitialUser(data:$data){ item { id } } }`,
  variables: { data: { name: "Owner", email: OWNER, password: env.STOIC_OPENSHIP_PASSWORD } } }) });
const j = await r.json();
console.log(j.data?.createInitialUser?.item?.id ? "admin claimed" : "not claimed: " + j.errors?.[0]?.message);
