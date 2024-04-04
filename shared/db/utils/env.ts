import { raise } from "@spill-it/utils/errors";
import { z } from "zod";

const parsing = z
  .object({
    PLACEHOLDER_PORTRAIT_URL: z.string().url(),
    SUPABASE_SERVICE_KEY: z.string(),
    SUPABASE_PROJECT_REF: z.string(),
    SUPABASE_STORAGE_PORTRAITS_BUCKET_NAME: z.string(),

    /** Also in `@spill-it/api` */
    ...{ SUPABASE_POSTGRES_URI_POOLING: z.string() },
  })
  .safeParse(process.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unexpected DB environment variables", parsing.error);
