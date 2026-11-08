"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { gql, OpenfrontError, regionId } from "./openfront";
import {
  cartCookie,
  clearCartCookie,
  clearSessionToken,
  sessionToken,
  setCartCookie,
  setSessionToken,
} from "./session";
import { cardPayments, getCustomer } from "./store";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

const fail = (error: unknown): ActionState => ({
  error: error instanceof OpenfrontError ? error.message : "Something went wrong. Please try again.",
});

async function auth() {
  const cart = await cartCookie();
  return { cart, headers: { cartProof: cart?.proof, token: await sessionToken() } };
}

async function ensureCart() {
  const existing = await cartCookie();
  if (existing) {
    try {
      await gql(`query($id:ID!){ activeCart(cartId:$id) }`, { id: existing.id }, { cartProof: existing.proof, token: await sessionToken() });
      return existing;
    } catch {
      await clearCartCookie();
    }
  }
  const data = await gql<{ createActiveCart: { id: string; proof: string } }>(
    `mutation($region:ID!){ createActiveCart(regionId:$region) }`,
    { region: await regionId() },
  );
  const cart = { id: data.createActiveCart.id, proof: data.createActiveCart.proof };
  await setCartCookie(cart);
  return cart;
}

export async function addToCart(_: ActionState, form: FormData): Promise<ActionState> {
  const variantId = String(form.get("variantId") ?? "");
  const quantity = Number(form.get("quantity") ?? 1);
  if (!variantId) return { error: "Choose a size first." };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return { error: "Choose a quantity from 1 to 20." };
  try {
    const cart = await ensureCart();
    await gql(
      `mutation($id:ID!,$data:CartUpdateInput!){ updateActiveCart(cartId:$id, data:$data){ id } }`,
      { id: cart.id, data: { lineItems: { create: [{ productVariant: { connect: { id: variantId } }, quantity }] } } },
      { cartProof: cart.proof, token: await sessionToken() },
    );
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Added to your bag." };
}

// Change a bag line's quantity (0 removes it). A failure leaves the bag as it
// was and is reported beside that line.
export async function updateLine(_: ActionState, form: FormData): Promise<ActionState> {
  const lineId = String(form.get("lineId") ?? "");
  const quantity = Number(form.get("quantity") ?? 0);
  const { cart, headers } = await auth();
  if (!cart) return { error: "Your bag has expired. Please add the piece again." };
  if (!lineId || !Number.isInteger(quantity) || quantity < 0 || quantity > 20) return { error: "Choose a quantity from 1 to 20." };
  try {
    if (quantity === 0)
      await gql(
        `mutation($id:ID!,$data:CartUpdateInput!){ updateActiveCart(cartId:$id, data:$data){ id } }`,
        { id: cart.id, data: { lineItems: { disconnect: [{ id: lineId }] } } },
        headers,
      );
    else
      await gql(
        `mutation($id:ID!,$line:ID!,$q:Int!){ updateActiveCartLineItem(cartId:$id, lineId:$line, quantity:$q){ id } }`,
        { id: cart.id, line: lineId, q: quantity },
        headers,
      );
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

const STATES = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split(" "));

// Contact and shipping details. Openfront ties addresses to a customer, so a
// first-time buyer gets a guest customer record (no usable password), exactly
// as Openfront's own storefront does. Only runs when checkout can complete.
export async function saveDetails(_: ActionState, form: FormData): Promise<ActionState> {
  const field = (name: string) => String(form.get(name) ?? "").trim();
  const email = field("email").toLowerCase();
  const address = {
    firstName: field("firstName"),
    lastName: field("lastName"),
    address1: field("address1"),
    address2: field("address2"),
    city: field("city"),
    province: field("province").toUpperCase(),
    postalCode: field("postalCode"),
    phone: field("phone"),
  };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!address.firstName || !address.lastName || !address.address1 || !address.city) return { error: "Fill in your name and street address." };
  if (!STATES.has(address.province)) return { error: "Choose a US state." };
  if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) return { error: "Enter a 5-digit ZIP code." };
  const optionId = field("shippingOptionId");
  if (!optionId) return { error: "Choose a shipping option." };

  const { cart } = await auth();
  if (!cart) return { error: "Your bag is empty." };
  let customer = await getCustomer();
  if (!customer?.tradeAccount && !(await cardPayments()))
    return { error: "Checkout opens when card payments are switched on. Nothing has been charged." };
  try {
    let token = await sessionToken();
    if (!customer) {
      const password = randomBytes(32).toString("hex");
      try {
        await gql(`mutation($data:UserCreateInput!){ createUser(data:$data){ id } }`, {
          data: { email, password, name: `${address.firstName} ${address.lastName}`, hasAccount: false },
        });
      } catch {
        return { error: "That email already has an account. Sign in from Account to check out with it." };
      }
      const signed = await gql<{ authenticateUserWithPassword: { sessionToken?: string } }>(
        `mutation($e:String!,$p:String!){ authenticateUserWithPassword(email:$e,password:$p){ ... on UserAuthenticationWithPasswordSuccess { sessionToken } } }`,
        { e: email, p: password },
      );
      token = signed.authenticateUserWithPassword.sessionToken ?? null;
      if (!token) return { error: "We could not start checkout. Please try again." };
      await setSessionToken(token);
      customer = await getCustomer();
    }
    const created = await gql<{ createAddress: { id: string } }>(
      `mutation($data:AddressCreateInput!){ createAddress(data:$data){ id } }`,
      { data: { ...address, country: { connect: { iso2: "us" } } } },
      { token },
    );
    const headers = { cartProof: cart.proof, token };
    await gql(
      `mutation($id:ID!,$data:CartUpdateInput!){ updateActiveCart(cartId:$id, data:$data){ id } }`,
      { id: cart.id, data: { email, shippingAddress: { connect: { id: created.createAddress.id } }, billingAddress: { connect: { id: created.createAddress.id } } } },
      headers,
    );
    await gql(
      `mutation($id:ID!,$option:ID!){ addActiveCartShippingMethod(cartId:$id, shippingMethodId:$option){ id } }`,
      { id: cart.id, option: optionId },
      headers,
    );
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/checkout");
  return { ok: true };
}

type Completed = { id: string; secretKey: string | null };

// Guest orders carry a secret key; orders by a signed-in customer (including
// trade orders on account) have none and are read with their session.
async function finish(order: Completed): Promise<never> {
  await clearCartCookie();
  revalidatePath("/", "layout");
  redirect(order.secretKey ? `/order/${order.id}?key=${encodeURIComponent(order.secretKey)}` : `/order/${order.id}`);
}

// Trade customers with an active Openfront business account order on account:
// no card is taken; the order is added to their account balance.
export async function placeTradeOrder(_: ActionState): Promise<ActionState> {
  const customer = await getCustomer();
  if (!customer?.tradeAccount) return { error: "Ordering on account needs an active trade account." };
  const { cart, headers } = await auth();
  if (!cart) return { error: "Your bag is empty." };
  let order: Completed;
  try {
    const data = await gql<{ completeActiveCart: Completed }>(
      `mutation($id:ID!){ completeActiveCart(cartId:$id) }`,
      { id: cart.id },
      headers,
    );
    order = data.completeActiveCart;
  } catch (error) {
    return fail(error);
  }
  return finish(order);
}

export async function startCardPayment(): Promise<{ clientSecret?: string; sessionId?: string; error?: string }> {
  const stripe = await cardPayments();
  const { cart, headers } = await auth();
  if (!stripe || !cart) return { error: "Card payments are not available." };
  try {
    await gql(`mutation($id:ID!){ createActiveCartPaymentSessions(cartId:$id){ id } }`, { id: cart.id }, headers);
    const data = await gql<{ setActiveCartPaymentSession: { paymentCollection: { paymentSessions: { id: string; isSelected: boolean; data: { clientSecret?: string } | null; paymentProvider: { code: string } }[] } } }>(
      `mutation($id:ID!,$provider:ID!){ setActiveCartPaymentSession(cartId:$id, providerId:$provider){ paymentCollection { paymentSessions { id isSelected data paymentProvider { code } } } } }`,
      { id: cart.id, provider: stripe.id },
      headers,
    );
    const session = data.setActiveCartPaymentSession.paymentCollection.paymentSessions.find(
      (s) => s.paymentProvider.code === stripe.code && s.isSelected,
    );
    if (!session?.data?.clientSecret) return { error: "The payment could not be started." };
    return { clientSecret: session.data.clientSecret, sessionId: session.id };
  } catch (error) {
    return { error: fail(error)?.error };
  }
}

export async function completeCardOrder(sessionId: string): Promise<ActionState> {
  const { cart, headers } = await auth();
  if (!cart) return { error: "Your bag is empty." };
  let order: Completed;
  try {
    const data = await gql<{ completeActiveCart: Completed }>(
      `mutation($id:ID!,$session:ID){ completeActiveCart(cartId:$id, paymentSessionId:$session) }`,
      { id: cart.id, session: sessionId },
      headers,
    );
    order = data.completeActiveCart;
  } catch (error) {
    return fail(error);
  }
  return finish(order);
}

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    const data = await gql<{ authenticateUserWithPassword: { sessionToken?: string; message?: string } }>(
      `mutation($e:String!,$p:String!){ authenticateUserWithPassword(email:$e,password:$p){
        ... on UserAuthenticationWithPasswordSuccess { sessionToken }
        ... on UserAuthenticationWithPasswordFailure { message } } }`,
      { e: email, p: password },
    );
    const token = data.authenticateUserWithPassword.sessionToken;
    if (!token) return { error: "That email and password do not match." };
    await setSessionToken(token);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  redirect("/account");
}

// A customer account in Openfront: orders placed while signed in show on the
// account page. (Guest checkouts create a passwordless record instead.)
export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name) return { error: "Enter your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 10) return { error: "Use a password of at least 10 characters." };
  try {
    await gql(`mutation($data:UserCreateInput!){ createUser(data:$data){ id } }`, { data: { name, email, password, hasAccount: true } });
  } catch {
    return { error: "That email already has an account here. Sign in instead." };
  }
  try {
    const data = await gql<{ authenticateUserWithPassword: { sessionToken?: string } }>(
      `mutation($e:String!,$p:String!){ authenticateUserWithPassword(email:$e,password:$p){ ... on UserAuthenticationWithPasswordSuccess { sessionToken } } }`,
      { e: email, p: password },
    );
    const token = data.authenticateUserWithPassword.sessionToken;
    if (!token) return { error: "Your account was created. Sign in to continue." };
    await setSessionToken(token);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOut() {
  await clearSessionToken();
  revalidatePath("/", "layout");
  redirect("/");
}
