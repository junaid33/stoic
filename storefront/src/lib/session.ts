import "server-only";
import { cookies } from "next/headers";

// Two httpOnly cookies: the guest cart (Openfront cart ID plus the signed proof
// Openfront issued for it) and an Openfront customer session token.

const CART = "stoic_cart";
const SESSION = "stoic_session";
const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export type CartCookie = { id: string; proof: string };

export async function cartCookie(): Promise<CartCookie | null> {
  const raw = (await cookies()).get(CART)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return typeof value?.id === "string" && typeof value?.proof === "string" ? value : null;
  } catch {
    return null;
  }
}

export async function setCartCookie(value: CartCookie) {
  (await cookies()).set(CART, JSON.stringify(value), { ...base, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearCartCookie() {
  (await cookies()).set(CART, "", { ...base, maxAge: 0 });
}

export async function sessionToken() {
  return (await cookies()).get(SESSION)?.value ?? null;
}

export async function setSessionToken(token: string) {
  (await cookies()).set(SESSION, token, { ...base, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSessionToken() {
  (await cookies()).set(SESSION, "", { ...base, maxAge: 0 });
}
