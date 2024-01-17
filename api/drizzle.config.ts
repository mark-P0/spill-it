import type { Config } from "drizzle-kit";
import { env } from "./src/utils/env";

/**
 * https://orm.drizzle.team/docs/migrations
 *
 * Uses implied `.env` file in the same directory as this file.
 */
export default {
  schema: "./data/schema.ts",
  out: "./data/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: env.SUPABASE_POSTGRES_URI_POOLING,
  },
} satisfies Config;
