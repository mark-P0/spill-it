import type { Config } from "drizzle-kit";
import { env } from "./api/utils/env";

/** https://orm.drizzle.team/docs/migrations */
export default {
  schema: "./api/data/schema.ts",
  out: "./api/data/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: env.SUPABASE_POSTGRES_URI_POOLING,
  },
} satisfies Config;
