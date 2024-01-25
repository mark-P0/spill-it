import type { Config } from "drizzle-kit";
import { env } from "./utils/env";

/**
 * https://orm.drizzle.team/docs/migrations
 *
 * Drizzle Kit implicitly uses an `.env` file in the same directory as this file (?)
 */
export default {
  schema: "./schema.ts",
  out: "./migrations/",
  driver: "pg",
  dbCredentials: {
    connectionString: env.SUPABASE_POSTGRES_URI_POOLING,
  },
} satisfies Config;
