// Writes catalog.json (and storefront/src/catalog.json) for STOIC: five pieces,
// each in the colours the owner's mock shows, sizes XS to XXL, one price per piece.
//   node scripts/catalog.mjs
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLOURS = {
  black: ["Washed black", "#1c1c1b"],
  grey: ["Stone grey", "#7d7a74"],
  bone: ["Bone", "#d9d0bf"],
  olive: ["Olive", "#5d6034"],
  rust: ["Rust", "#9c4f43"],
  charcoal: ["Charcoal", "#34363a"],
};

const pieces = [
  {
    handle: "sculpture-hoodie", code: "SCH", title: "The Sculpture Hoodie", category: "hoodies", price: 11800,
    colours: ["black", "grey", "bone", "olive"],
    blurb: "Oversized heavyweight hoodie featuring a striking graphic of a classical sculpture.",
    bullets: ["100% Cotton", "Relaxed Fit", "Garment Dyed"],
    photos: ["sculpture-hoodie.webp", "sculpture-hoodie-pdp.webp"],
  },
  {
    handle: "emperor-tee", code: "EMP", title: "The Emperor Tee", category: "tees", price: 6200,
    colours: ["bone", "black"],
    blurb: "Boxy fit tee with a weathered screenprint of a classical sculpture on the chest.",
    bullets: ["100% Cotton", "Vintage Wash", "Boxy Fit"],
    photos: ["emperor-tee.webp"],
  },
  {
    handle: "stoic-ls", code: "SLS", title: "The Stoic L/S", category: "long-sleeves", price: 7600,
    colours: ["black", "olive"],
    blurb: "Long sleeve with a laurel wreath on the chest and subtle branding.",
    bullets: ["100% Cotton", "Vintage Wash", "Relaxed Fit"],
    photos: ["stoic-ls.webp"],
  },
  {
    handle: "virtue-tee", code: "VRT", title: "The Virtue Tee", category: "tees", price: 6200,
    colours: ["bone", "olive", "black", "rust"],
    blurb: "Boxy fit tee featuring a classical sculpture graphic.",
    bullets: ["100% Cotton", "Vintage Wash", "Relaxed Fit"],
    photos: ["virtue-tee.webp", "virtue-tee-pdp.webp"],
  },
  {
    handle: "philosopher-ls", code: "PHL", title: "The Philosopher L/S", category: "long-sleeves", price: 7600,
    colours: ["charcoal", "olive"],
    blurb: "Long sleeve with classical artwork and subtle branding.",
    bullets: ["100% Cotton", "Vintage Wash", "Relaxed Fit"],
    photos: ["philosopher-ls.webp", "philosopher-ls-pdp.webp"],
  },
];

const catalog = {
  version: 1,
  shop: {
    slug: "stoic",
    name: "STOIC",
    tagline: "Classical sculpture, screenprinted on heavyweight garment-dyed blanks.",
    about:
      "STOIC prints classical sculpture as weathered screenprint on heavyweight, garment-dyed blanks: coarse halftone and peeling spot colour in olive, ochre, rust and stone, on washed black, bone and olive. Five pieces, made to order by Printful and shipped directly. The shop runs on its own stack: Openfront sells, Printful prints.",
    category: "Apparel",
    accent: "#C08A2B",
    currency: "usd",
    region: { code: "us", name: "United States", taxRate: 0, countries: [{ iso2: "us", iso3: "usa", numCode: 840, name: "United States", displayName: "United States" }] },
    shipping: [{ name: "Standard shipping", amount: 800 }],
  },
  assetsBase: "",
  categories: [
    { handle: "tees", title: "Tees" },
    { handle: "hoodies", title: "Hoodies" },
    { handle: "long-sleeves", title: "Long sleeves" },
  ],
  products: pieces.map((p) => ({
    handle: p.handle,
    title: p.title,
    category: p.category,
    design: "sculpture",
    description: `${p.blurb} ${p.bullets.join(", ")}. Made to order and shipped in 5 to 8 days.`,
    blurb: p.blurb,
    bullets: p.bullets,
    image: `/photos/${p.photos[0]}`,
    photos: p.photos.map((f) => `/photos/${f}`),
    options: ["Color", "Size"],
    colours: p.colours.map((c) => ({ id: c, name: COLOURS[c][0], hex: COLOURS[c][1] })),
    variants: p.colours.flatMap((c) =>
      SIZES.map((s) => ({ title: `${COLOURS[c][0]} / ${s}`, sku: `STO-${p.code}-${c.toUpperCase().slice(0, 3)}-${s}`, price: p.price, options: [COLOURS[c][0], s] })),
    ),
  })),
};
const json = JSON.stringify(catalog, null, 2) + "\n";
writeFileSync(resolve(root, "catalog.json"), json);
writeFileSync(resolve(root, "storefront/src/catalog.json"), json);
console.log(`${catalog.products.length} products, ${catalog.products.reduce((n, p) => n + p.variants.length, 0)} variants.`);
