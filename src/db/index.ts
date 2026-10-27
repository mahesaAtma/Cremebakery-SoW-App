import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { sowDb?: DB };

function connect(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur. Lihat README.");
  const client = postgres(url, {
    // Required for Supabase's transaction pooler (port 6543)
    prepare: false,
    // A few connections per serverless instance is plenty for this app and
    // keeps the pooler from filling up when many instances start at once.
    // Pages run their queries one after another (not in parallel), because
    // postgres.js pipelines parallel queries on one connection, which can leave
    // them stuck behind Supabase's transaction pooler until they time out.
    max: 3,
    // Fail fast instead of hanging until Vercel's function limit.
    connect_timeout: 10,
    // Close idle connections so frozen serverless instances don't hold them.
    idle_timeout: 20,
  });
  return drizzle(client, { schema });
}

/** Connects on first use, so builds don't need a database. */
export const db = new Proxy({} as DB, {
  get(_, prop) {
    globalForDb.sowDb ??= connect();
    const value = Reflect.get(globalForDb.sowDb, prop);
    return typeof value === "function" ? value.bind(globalForDb.sowDb) : value;
  },
});

export { schema };
