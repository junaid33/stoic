import "server-only";

// STOIC reads and writes through Openfront's GraphQL API only. Carts are
// guest carts proven by Openfront's signed cart proof; customers sign in with
// Openfront sessions. Both live in httpOnly cookies (see session.ts).

const origin = () => {
  const value = process.env.OPENFRONT_URL;
  if (!value) throw new Error("OPENFRONT_URL is not configured.");
  return value.replace(/\/+$/, "");
};

export class OpenfrontError extends Error {}

type GraphQLError = { message?: string; extensions?: { originalError?: { message?: string } } };

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  auth: { token?: string | null; cartProof?: string | null } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${origin()}/api/graphql`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        ...(auth.cartProof ? { "x-openfront-cart-proof": auth.cartProof } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new OpenfrontError("The store is not responding. Please try again in a moment.");
  }
  const json = (await response.json().catch(() => null)) as { data?: T; errors?: GraphQLError[] } | null;
  if (!json || json.errors?.length || !json.data) {
    const error = json?.errors?.[0];
    throw new OpenfrontError(error?.extensions?.originalError?.message || error?.message || `Store error (${response.status}).`);
  }
  return json.data;
}

export const regionCode = () => process.env.OPENFRONT_REGION_CODE || "us";

let regionMemo: { id: string; at: number } | null = null;
export async function regionId() {
  if (regionMemo && Date.now() - regionMemo.at < 300_000) return regionMemo.id;
  const data = await gql<{ regions: { id: string }[] }>(
    `query($code:String!){ regions(where:{ code:{ equals:$code } }, take:1){ id } }`,
    { code: regionCode() },
  );
  const id = data.regions[0]?.id;
  if (!id) throw new OpenfrontError("This store has no shipping region yet.");
  regionMemo = { id, at: Date.now() };
  return id;
}
