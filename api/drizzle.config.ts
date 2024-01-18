import { env } from "@spill-it/env";
import type { Config } from "drizzle-kit";

/**
 * https://orm.drizzle.team/docs/migrations
 *
 * Drizzle Kit implicitly uses an `.env` file in the same directory as this file (?)
 */
export default {
  schema: "./data/schema.ts",
  out: "./data/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: env.SUPABASE_POSTGRES_URI_POOLING,
  },
} satisfies Config;
