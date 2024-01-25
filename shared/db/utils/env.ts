import { raise } from "@spill-it/utils/errors";
import { z } from "zod";

const parsing = z
  .object({
    SUPABASE_POSTGRES_URI_POOLING: z.string(), // Also defined on API
  })
  .safeParse(process.env);
export const env = parsing.success
  ? parsing.data
  : raise(
      "Unexpected environment variables for database functions",
      parsing.error,
    );
