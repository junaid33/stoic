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
