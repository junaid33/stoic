# STOIC

STOIC's catalog, product photos, storefront and operating scripts. It sells through its own Openfront on Railway
(project "STOIC") with Printful behind it, and is listed on the Agent Commerce leaderboard. Built after Openship Supply.

| Folder | What it holds |
|---|---|
| `catalog.json` | The catalog, written by `scripts/catalog.mjs` (the storefront keeps a copy) |
| `storefront/` | The Next.js storefront (own `package.json`; deployed with `railway up`) |
| `scripts/` | `claim-admin.mjs`, `setup.mjs` (store, region, Stripe, catalog), `catalog.mjs` |

Scripts read secrets from `.env.local` (gitignored, mode 0600).

Railway project `3a4cdd88-48ff-4889-9c71-a57d89893e0c`, environment production `c6189dc9-66fc-4f39-afe7-24b6731609ff`:
Openfront `c557b67f-cccf-42ca-b205-a385a31536be`, storefront `3d42a8b2-7892-4d25-af5d-295d048414ac`, Postgres, bucket `stoic-media`.
Deploy the storefront from `storefront/`: `railway up -p <project> -e production -s storefront --ci`.

## Openship and fulfilment (2026-11-09)

STOIC runs the same stack as Openship Supply and TESSIER, inside the same Railway project:

| Service | ID | URL |
|---|---|---|
| Openship (`openshiporg/openship` at `87a4899`, the commit TESSIER runs; `railway up`, build `keystone build --no-ui && next build`, start `npm run migrate && next start`) | `35279c1a-4d35-4961-be0e-268ddc7db58f` | https://openship-production-f7b3.up.railway.app |
| Postgres-p6KO (Openship's database) | `f7d9f2ce-2476-42c6-abe0-1d87bb9d7174` | private |
| pod-adapter (unmodified copy of `agent-commerce/services/pod-adapter`) | `bd680ad3-1c41-4516-85f4-2dba6eba04f0` | https://pod-adapter-production-d499.up.railway.app |

- `scripts/claim-openship.mjs` claimed Openship's first admin (credentials in `.env.local`: `STOIC_OPENSHIP_*`). Owner: change the password.
- Agent Commerce's own `/api/connect` ran with provider **manual** ("Fulfil myself"): Openship was registered as an Openfront OAuth app, approved on Openfront's consent screen, the STOIC shop connected, and the ORDER_CREATED / ORDER_CANCELLED webhooks set. Orders now land in Openship and wait there.
- `scripts/sync-images.mjs` uploads each product's photo to Openfront. **Required:** Openship rejects an order whose products have no image (`LineItem.image: missing value`); the first test order was lost to this. Run it again after any new product.
- Agent Commerce lists STOIC as Openfront + Openship + Stripe + Railway (commit c1fca22), so the board shows the Openship mark.

### When the Printful key arrives (what flips)
1. Owner puts `PRINTFUL_API_KEY` (and `STOIC_PRINTFUL_STORE_ID` if the token is account-level) in `.env.local`.
2. Add the `pod` blocks (Printful product, `podVariantId`, front print files) to `catalog.json`, as Openship Supply's `scripts/catalog.mjs` does.
3. Start Agent Commerce with `AC_POD_ADAPTER_URL=https://pod-adapter-production-d499.up.railway.app` and re-run the connect with `fulfillment: { provider: "printful", apiKey, storeId }` and the catalog (the shape of `openship-supply/scripts/setup.mjs`). That adds the designs to Printful, creates the Printful channel in Openship with the key as its access token, and links the shop so every order routes to it.
4. Leave `PRINTFUL_ALLOW_CONFIRM` and `confirmOrders` unset: orders stay Printful drafts until the owner approves.
5. Then make `agent-commerce/tests/shop-catalogs.test.ts` stop skipping STOIC's catalog parse (`connect: false`).
