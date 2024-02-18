import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/drizzle";
import { env } from "./utils/env";

const pool = new Pool({
  connectionString: env.SUPABASE_POSTGRES_URI_POOLING,
});
export const db = drizzle(pool, { schema });

/**
 * Type of `tx` in
 *
 * ```ts
 * db.transaction(async (tx) => {})
 * ```
 */
export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
