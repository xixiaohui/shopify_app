import { Session } from "@shopify/shopify-api";
import { ensureSessionTable, pool } from "@/lib/db";

/**
 * Persists a Shopify offline session (containing the access token) in Postgres.
 *
 * `@shopify/shopify-api` v14 no longer ships a session storage abstraction, so
 * the app is responsible for saving the session returned by the OAuth callback.
 */
export async function storeSession(session: Session): Promise<void> {
  await ensureSessionTable();
  await pool.query(
    `INSERT INTO "ShopifySession" ("id", "shop", "data", "updatedAt")
     VALUES ($1, $2, $3, now())
     ON CONFLICT ("shop")
     DO UPDATE SET "data" = EXCLUDED."data", "updatedAt" = now()`,
    [session.id, session.shop, JSON.stringify(session.toObject())],
  );
}

export async function loadSession(shop: string): Promise<Session | undefined> {
  await ensureSessionTable();
  const result = await pool.query(
    `SELECT "data" FROM "ShopifySession" WHERE "shop" = $1`,
    [shop],
  );
  const row = result.rows[0];
  if (!row) return undefined;
  return sessionFromData(row.data);
}

type StoredSession = {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope?: string;
  expires?: string | null;
  accessToken?: string;
  refreshToken?: string;
  refreshTokenExpires?: string | null;
  onlineAccessInfo?: Session["onlineAccessInfo"];
};

function sessionFromData(data: StoredSession): Session {
  return new Session({
    id: data.id,
    shop: data.shop,
    state: data.state,
    isOnline: data.isOnline,
    scope: data.scope,
    expires: data.expires ? new Date(data.expires) : undefined,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    refreshTokenExpires: data.refreshTokenExpires
      ? new Date(data.refreshTokenExpires)
      : undefined,
    onlineAccessInfo: data.onlineAccessInfo,
  });
}
