import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../utils/env";
import { localizeLogger } from "../utils/logger";
import * as schema from "./schema";

const logger = localizeLogger(import.meta.url);

logger.info("Connecting to database");
const pool = new Pool({
  connectionString: env.SUPABASE_POSTGRES_URI_POOLING,
});
export const db = drizzle(pool, { schema });
