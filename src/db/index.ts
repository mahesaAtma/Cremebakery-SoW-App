import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { sowDb?: DB };

function connect(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur. Lihat README.");
  // prepare: false is required for Supabase's transaction pooler (port 6543)
  const client = postgres(url, { prepare: false, max: 5 });
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
