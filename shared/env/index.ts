import { raise } from "@spill-it/utils/errors";
import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: path.join(__dirname, "./.env") });

const parsing = z
  .object({
    NODE_ENV: z.enum(["development", "production"]),
    SUPABASE_POSTGRES_URI_POOLING: z.string(),
    AUTH_GOOGLE_CLIENT_ID: z.string(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string(),
    LOG_LEVEL: z.string(),
    API_BASE_URL_DEV: z.string().url(),
    API_BASE_URL_PROD: z.string().url(),
  })
  .safeParse(process.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unsatisfactory environment variables");
