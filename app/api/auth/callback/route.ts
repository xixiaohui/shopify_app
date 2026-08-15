import { shopify } from "@/lib/shopify/shopify.server";
import { storeSession } from "@/lib/shopify/session-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { headers, session } = await shopify.auth.callback({
    rawRequest: request,
  });

  await storeSession(session);

  const url = new URL(request.url);
  const host = url.searchParams.get("host");

  const redirectUrl = new URL("/", url);
  redirectUrl.searchParams.set("shop", session.shop);
  if (host) redirectUrl.searchParams.set("host", host);

  // Forward the callback's Set-Cookie headers (clears the OAuth state cookie).
  const responseHeaders = new Headers({ Location: redirectUrl.toString() });
  const setCookies = headers?.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    responseHeaders.append("Set-Cookie", cookie);
  }

  return new Response(null, { status: 302, headers: responseHeaders });
}
