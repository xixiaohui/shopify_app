import { Pool } from "pg";

// Reuse a single pool across Next.js hot reloads in development.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

const CREATE_SESSION_TABLE = `
  CREATE TABLE IF NOT EXISTS "ShopifySession" (
    "id" TEXT PRIMARY KEY,
    "shop" TEXT NOT NULL UNIQUE,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

let tableEnsured = false;

export async function ensureSessionTable(): Promise<void> {
  if (tableEnsured) return;
  await pool.query(CREATE_SESSION_TABLE);
  tableEnsured = true;
}
