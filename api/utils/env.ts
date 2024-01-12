import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  SUPABASE_POSTGRES_URI_POOLING: z.string(),
  AUTH_GOOGLE_CLIENT_ID: z.string(),
  AUTH_GOOGLE_CLIENT_SECRET: z.string(),
  COOKIE_SESSION_KEY: z.string(),
  LOG_LEVEL: z.string(),
});
export const env = EnvSchema.parse(process.env);
