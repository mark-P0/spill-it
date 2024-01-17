import { z } from "zod";
import { raise } from "./errors";

const parsing = z
  .object({
    NODE_ENV: z.enum(["development", "production"]),
    SUPABASE_POSTGRES_URI_POOLING: z.string(),
    AUTH_GOOGLE_CLIENT_ID: z.string(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string(),
    LOG_LEVEL: z.string(),
  })
  .safeParse(process.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unexpected environment variables", parsing.error);
