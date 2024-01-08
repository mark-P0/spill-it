import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
});
export const env = EnvSchema.parse(process.env);
