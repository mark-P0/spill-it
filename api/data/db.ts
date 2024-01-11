import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../utils/env";

const pool = new Pool({
  connectionString: env.SUPABASE_POSTGRES_URI_POOLING,
});

export const db = drizzle(pool);