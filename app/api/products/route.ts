import { shopify } from "@/lib/shopify/shopify.server";
import { loadSession } from "@/lib/shopify/session-storage";

export const dynamic = "force-dynamic";

const PRODUCTS_QUERY = `#graphql
  query {
    shop {
      name
    }
    products(first: 10) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    console.error("[products] Missing Authorization header");
    return new Response("Missing Authorization header", { status: 401 });
  }

  const matches = authHeader.match(/^Bearer (.+)$/);
  if (!matches) {
    console.error("[products] Malformed Authorization header");
    return new Response("Malformed Authorization header", { status: 401 });
  }

  let payload;
  try {
    payload = await shopify.session.decodeSessionToken(matches[1]);
  } catch (err) {
    console.error(
      "[products] Invalid session token:",
      err instanceof Error ? err.message : err,
    );
    return new Response("Invalid session token", { status: 401 });
  }

  // `dest` is the shop domain with scheme, e.g. https://example.myshopify.com
  const shop = payload.dest.replace(/^https:\/\//, "");
  const session = await loadSession(shop);

  if (!session) {
    console.error("[products] No session found for shop:", shop);
    return new Response("No session found for shop", { status: 401 });
  }

  const client = new shopify.clients.Graphql({ session });
  const result = await client.request(PRODUCTS_QUERY);

  return Response.json({ shop, data: result.data });
}
