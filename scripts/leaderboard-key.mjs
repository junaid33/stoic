// Creates the read-only Openfront API key the Agent Commerce leaderboard uses
// to read STOIC's orders, payments and products (src/lib/server/live-shops.ts).
//
// Openfront grants an API key only what its scopes AND its owner's role both
// allow, so a key created by the admin could write anything its scopes name.
// The key is therefore owned by a dedicated reader user whose role holds only
// the three read permissions: it can do only what they allow.
// The script checks that a write is refused before it keeps the key.
//
// The key is generated here, stored only in .env.local as
// STOIC_OPENFRONT_API_KEY (Openfront keeps a bcrypt hash) and never printed.
// The leaderboard reads it from agent-commerce, so copy it to agent-commerce's
// .env.local and its Vercel environment as STOIC_OPENFRONT_API_KEY too.
//
//   node scripts/leaderboard-key.mjs
import { randomBytes } from "node:crypto";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { envPath, readEnv } from "./env.mjs";

const NAME = "Agent Commerce leaderboard (read only)";
const READER = "leaderboard-reader@stoic.invalid";
const env = readEnv();
const url = env.STOIC_OPENFRONT_URL;
const gql = async (query, variables = {}, token) => {
  const response = await fetch(url + "/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
};

const login = await gql(
  `mutation($e:String!,$p:String!){ authenticateUserWithPassword(email:$e,password:$p){ ... on UserAuthenticationWithPasswordSuccess { sessionToken } } }`,
  { e: env.STOIC_OPENFRONT_EMAIL, p: env.STOIC_OPENFRONT_PASSWORD },
);
const admin = login.authenticateUserWithPassword.sessionToken;

// The reader: a user with no role and a random password nobody keeps.
let reader = (await gql(`query($e:String!){ users(where:{ email:{ equals:$e } }){ id role { id } } }`, { e: READER }, admin)).users[0];
if (!reader) {
  reader = (
    await gql(
      `mutation($data: UserCreateInput!){ createUser(data:$data){ id role { id } } }`,
      { data: { name: "Leaderboard reader", email: READER, password: randomBytes(32).toString("hex"), hasAccount: false } },
      admin,
    )
  ).createUser;
}
const READ = { canReadOrders: true, canReadPayments: true, canReadProducts: true };
let role = (await gql(`query{ roles(where:{ name:{ equals:"Leaderboard reader" } }){ id } }`, {}, admin)).roles[0];
if (!role) role = (await gql(`mutation($d:RoleCreateInput!){ createRole(data:$d){ id } }`, { d: { name: "Leaderboard reader", ...READ } }, admin)).createRole;
await gql(`mutation($id:ID!,$r:ID!){ updateUser(where:{id:$id}, data:{ role:{ connect:{ id:$r } } }){ id } }`, { id: reader.id, r: role.id }, admin);

// Replace any earlier leaderboard keys.
const old = await gql(`query($n:String!){ apiKeys(where:{ name:{ equals:$n } }){ id } }`, { n: NAME }, admin);
if (old.apiKeys.length) await gql(`mutation($w:[ApiKeyWhereUniqueInput!]!){ deleteApiKeys(where:$w){ id } }`, { w: old.apiKeys.map(({ id }) => ({ id })) }, admin);

const token = "of_" + randomBytes(32).toString("base64url");
await gql(
  `mutation($data: ApiKeyCreateInput!){ createApiKey(data:$data){ id } }`,
  {
    data: {
      name: NAME,
      tokenSecret: token,
      tokenPreview: `${token.slice(0, 7)}...${token.slice(-4)}`,
      scopes: ["read_orders", "read_payments", "read_products"],
      status: "active",
      user: { connect: { id: reader.id } },
    },
  },
  admin,
);

const read = await gql(`{ productsCount ordersCount }`, {}, token);
const write = await gql(`mutation{ createProductCategory(data:{ title:"Key probe", handle:"key-probe" }){ id } }`, {}, token).catch((e) => ({ refused: e.message }));
if (!write.refused) {
  await gql(`mutation{ deleteProductCategories(where:[{ handle:"key-probe" }]){ id } }`, {}, admin);
  const made = await gql(`query($n:String!){ apiKeys(where:{ name:{ equals:$n } }){ id } }`, { n: NAME }, admin);
  await gql(`mutation($w:[ApiKeyWhereUniqueInput!]!){ deleteApiKeys(where:$w){ id } }`, { w: made.apiKeys.map(({ id }) => ({ id })) }, admin);
  throw new Error("The key could write: it was not stored. Check the reader user's role.");
}

const lines = readFileSync(envPath, "utf8").split("\n").filter((line) => !line.startsWith("STOIC_OPENFRONT_API_KEY=") && line !== "# Read-only Openfront key for STOIC's leaderboard listing.");
while (lines.length && lines.at(-1) === "") lines.pop();
lines.push("# Read-only Openfront key for STOIC's leaderboard listing.", `STOIC_OPENFRONT_API_KEY=${token}`, "");
writeFileSync(envPath, lines.join("\n"), { mode: 0o600 });
chmodSync(envPath, 0o600);
console.log(`Leaderboard key stored: reads ${read.productsCount} products and ${read.ordersCount} orders; writes are refused.`);
