import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  SUPABASE_POSTGRES_URI_POOLING: z.string(),
});
export const env = EnvSchema.parse(process.env);
