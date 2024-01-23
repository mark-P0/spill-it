import { raise } from "@spill-it/utils/errors";
import { z } from "zod";

const parsing = z
  .object({
    NODE_ENV: z.enum(["development", "production"]),
    SUPABASE_POSTGRES_URI_POOLING: z.string(),
    AUTH_GOOGLE_CLIENT_ID: z.string(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string(),
    LOG_LEVEL: z.string(),
    HOST_API_DEV: z.string().url(),
    HOST_API_PROD: z.string().url(),
    HOST_UI_DEV: z.string().url(),
    HOST_UI_PROD: z.string().url(),
  })
  .safeParse(process.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unexpected environment variables", parsing.error);
