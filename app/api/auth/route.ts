import { shopify } from "@/lib/shopify/shopify.server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const shop = new URL(request.url).searchParams.get("shop");

  if (!shop) {
    return new Response("Missing shop parameter", { status: 400 });
  }

  return shopify.auth.begin({
    shop,
    callbackPath: "/api/auth/callback",
    isOnline: false,
    rawRequest: request,
  });
}
