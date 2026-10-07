/* Apply SQL migrations in ./drizzle to DATABASE_URL (or the local PGlite store). */
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  const folder = path.join(process.cwd(), "drizzle");
  if (url && !/^replace/.test(url)) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const needsSsl = !/localhost|127\.0\.0\.1/.test(url) && !/sslmode=disable/.test(url);
    const pool = new Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });
    await migrate(drizzle(pool), { migrationsFolder: folder });
    await pool.end();
    console.log("Migrations applied to DATABASE_URL");
  } else {
    const fs = await import("node:fs");
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const dir = path.resolve(process.env.PGLITE_DIR || "./.data/pglite");
    fs.mkdirSync(dir, { recursive: true });
    const client = await PGlite.create(dir);
    await migrate(drizzle(client), { migrationsFolder: folder });
    await client.close();
    console.log(`Migrations applied to PGlite at ${dir}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
