import "server-only";
import catalog from "@/catalog.json";
import { gql, regionCode, regionId } from "./openfront";
import { cartCookie, sessionToken } from "./session";

// Product data (titles, prices, variants) comes from Openfront. The shop's
// catalog file adds what Openfront does not hold: the photos, the colours
// with their swatches and the copy under each piece.

export type Kind = "tee" | "hoodie" | "longsleeve";
export type Variant = { id: string; title: string; sku: string; price: number; options: string[] };
export type Colour = { id: string; name: string; hex: string };
export type Product = {
  id: string;
  handle: string;
  title: string;
  blurb: string;
  bullets: string[];
  variants: Variant[];
  colours: Colour[];
  sizes: string[];
  price: number;
  image: string;
  photos: string[];
  photosByColour?: Record<string, string[]>;
  kind: Kind;
};

type Remote = {
  id: string;
  title: string;
  handle: string;
  productVariants: { id: string; title: string; sku: string | null; prices: { amount: number; region: { code: string } | null }[] }[];
};

const KINDS: Record<string, Kind> = { tees: "tee", hoodies: "hoodie", "long-sleeves": "longsleeve" };
const local = new Map(catalog.products.map((p) => [p.handle, p]));
export const kindOf = (handle: string): Kind => KINDS[local.get(handle)?.category ?? "tees"] ?? "tee";
export const imageOf = (handle: string) => local.get(handle)?.image ?? "/art/hero-bust.webp";
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function toProduct(remote: Remote): Product | null {
  const meta = local.get(remote.handle);
  // The local catalog is the publication allowlist, including direct URLs.
  if (!meta) return null;
  const variants = remote.productVariants
    .map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku ?? "",
      price: v.prices.find((p) => p.region?.code === regionCode())?.amount ?? 0,
      options: v.title.split(" / "),
    }))
    .filter((v) => v.price > 0);
  if (!variants.length) return null;
  return {
    id: remote.id,
    handle: remote.handle,
    title: remote.title,
    blurb: meta.blurb,
    bullets: meta.bullets,
    variants,
    colours: meta.colours,
    sizes: SIZE_ORDER.filter((s) => variants.some((v) => v.options[1] === s)),
    price: Math.min(...variants.map((v) => v.price)),
    image: imageOf(remote.handle),
    photos: meta.photos,
    photosByColour: (meta as { photosByColour?: Record<string, string[]> }).photosByColour,
    kind: kindOf(remote.handle),
  };
}

const PRODUCT_FIELDS = `id title handle
  productVariants(orderBy:{ variantRank: asc }) { id title sku prices { amount region { code } } }`;

export async function listProducts() {
  const data = await gql<{ products: Remote[] }>(
    `{ products(where:{ status:{ equals: published } }, orderBy:{ createdAt: asc }, take: 48){ ${PRODUCT_FIELDS} } }`,
  );
  const order = catalog.products.map((p) => p.handle);
  return data.products
    .map(toProduct)
    .filter((p): p is Product => !!p)
    .sort((a, b) => order.indexOf(a.handle) - order.indexOf(b.handle));
}

export async function getProduct(handle: string) {
  const data = await gql<{ products: Remote[] }>(
    `query($handle:String!){ products(where:{ handle:{ equals:$handle }, status:{ equals: published } }, take:1){ ${PRODUCT_FIELDS} } }`,
    { handle },
  );
  return data.products[0] ? toProduct(data.products[0]) : null;
}

// A cart line's photo: the product's first photo.
export const lineImage = (handle: string, _variantTitle?: string) => imageOf(handle);

export type CartLine = {
  id: string;
  quantity: number;
  title: string;
  unitPrice: string;
  total: string;
  productVariant: { id: string; title: string; product: { handle: string; title: string } };
};
export type Cart = {
  id: string;
  email: string | null;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  rawTotal: number;
  lineItems: CartLine[];
  shippingAddress: { id: string; firstName: string; lastName: string; address1: string; city: string; province: string; postalCode: string } | null;
  shippingMethods: { id: string; shippingOption?: { id: string; name: string } | null }[];
};

export async function getCart(): Promise<Cart | null> {
  const cookie = await cartCookie();
  if (!cookie) return null;
  try {
    const data = await gql<{ activeCart: Cart | null }>(
      `query($id:ID!){ activeCart(cartId:$id) }`,
      { id: cookie.id },
      { cartProof: cookie.proof, token: await sessionToken() },
    );
    return data.activeCart;
  } catch {
    return null; // Expired or completed cart: treat as empty.
  }
}

export const cartCount = (cart: Cart | null) => (cart?.lineItems ?? []).reduce((n, line) => n + line.quantity, 0);

export type Customer = { id: string; name: string | null; email: string; tradeAccount: boolean };

export async function getCustomer(): Promise<Customer | null> {
  const token = await sessionToken();
  if (!token) return null;
  try {
    // Customers cannot list Account records; Openfront exposes their own
    // accounts through getCustomerAccounts.
    const data = await gql<{
      authenticatedItem: { id: string; name: string | null; email: string } | null;
      getCustomerAccounts: { status: string; accountType?: string }[] | null;
    }>(`{ authenticatedItem { ... on User { id name email } } getCustomerAccounts }`, {}, { token });
    const user = data.authenticatedItem;
    const trade = (data.getCustomerAccounts ?? []).some((a) => a.status === "active" && (a.accountType ?? "business") === "business");
    return user ? { id: user.id, name: user.name, email: user.email, tradeAccount: trade } : null;
  } catch {
    return null;
  }
}

export async function shippingOptions(cartId: string, proof: string) {
  const data = await gql<{ activeCartShippingOptions: { id: string; name: string; amount: number }[] }>(
    `query($id:ID!){ activeCartShippingOptions(cartId:$id){ id name amount } }`,
    { id: cartId },
    { cartProof: proof, token: await sessionToken() },
  );
  return data.activeCartShippingOptions;
}

export async function paymentProviders() {
  const data = await gql<{ activeCartPaymentProviders: { id: string; code: string }[] }>(
    `query($r:ID!){ activeCartPaymentProviders(regionId:$r){ id code } }`,
    { r: await regionId() },
  );
  return data.activeCartPaymentProviders;
}

// Stripe's publishable key, read at request time (not inlined at build) so
// the owner can switch card payments on with a variable change alone.
export const stripePublishableKey = () => process.env.STRIPE_PUBLISHABLE_KEY || null;

// Card checkout opens only when Openfront has Stripe installed on the region
// and the storefront has the publishable key.
export async function cardPayments() {
  if (!stripePublishableKey()) return null;
  const stripe = (await paymentProviders()).find((p) => p.code.startsWith("pp_stripe"));
  return stripe ?? null;
}

export type Order = {
  id: string;
  displayId: number;
  status: string;
  fulfillmentStatus?: FulfillmentStatus;
  email: string;
  total: string;
  subtotal: string;
  shipping: string;
  createdAt: string;
  tax?: string;
  lineItems?: { id: string; title: string; quantity: number; variantTitle: string; formattedTotal: string; productData?: { handle?: string } | null }[];
  fulfillments?: { id: string; createdAt?: string; shippingLabels: { trackingNumber: string | null; trackingUrl: string | null; carrier: string | null }[] }[];
};

// Openfront's virtual fulfillmentStatus: counts plus a fulfilled and a shipped state.
export type FulfillmentStatus = { status?: string; shippingStatus?: string } | null;
export type OrderSummary = { id: string; displayId: number; status: string; fulfillmentStatus: FulfillmentStatus; total: string; createdAt: string; lineItems: { id: string; title: string; quantity: number }[] };

export async function getOrders(): Promise<OrderSummary[]> {
  const token = await sessionToken();
  if (!token) return [];
  try {
    const data = await gql<{ getCustomerOrders: OrderSummary[] | null }>(`{ getCustomerOrders(limit: 20) }`, {}, { token });
    return data.getCustomerOrders ?? [];
  } catch {
    return [];
  }
}

export async function getOrder(id: string, secretKey?: string) {
  try {
    const data = await gql<{ getCustomerOrder: Order | null }>(
      `query($id:ID!,$key:String){ getCustomerOrder(orderId:$id, secretKey:$key) }`,
      { id, key: secretKey || null },
      secretKey ? {} : { token: await sessionToken() },
    );
    return data.getCustomerOrder;
  } catch {
    return null;
  }
}

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

