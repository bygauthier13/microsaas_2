import path from "node:path";
import fs from "node:fs";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { config } from "@/lib/config";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

type GlobalWithDb = typeof globalThis & { __ensignDb?: Promise<DB> };
const g = globalThis as GlobalWithDb;

async function createPglite(): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = path.resolve(config.database.pgliteDir);
  fs.mkdirSync(dir, { recursive: true });
  const client = await PGlite.create(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return db as unknown as DB;
}

async function createPostgres(url: string): Promise<DB> {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const needsSsl = !/localhost|127\.0\.0\.1/.test(url) && !/sslmode=disable/.test(url);
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL_MAX || 5),
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });
  const db = drizzle(pool, { schema });
  if (config.database.autoMigrate) {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  }
  return db;
}

/**
 * Lazily-initialised database. Uses Postgres when DATABASE_URL is set, otherwise an
 * embedded PGlite (real Postgres compiled to WASM) so the product runs with zero setup.
 */
export function getDb(): Promise<DB> {
  if (!g.__ensignDb) {
    g.__ensignDb = (config.database.url ? createPostgres(config.database.url) : createPglite()).catch((err) => {
      g.__ensignDb = undefined;
      throw err;
    });
  }
  return g.__ensignDb;
}

export { schema };
