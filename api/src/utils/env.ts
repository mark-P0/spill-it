import { raise } from "@spill-it/utils/errors";
import { z } from "zod";

const parsing = z
  .object({
    NODE_ENV: z.enum(["development", "production"]),
    LOG_LEVEL: z.string(),

    /** Also in `@spill-it/auth` */
    ...{
      AUTH_GOOGLE_CLIENT_ID: z.string(),
      AUTH_GOOGLE_CLIENT_SECRET: z.string(),
      HMAC_KEY: z.string(),
    },

    /** Also in `@spill-it/db` */
    ...{ SUPABASE_POSTGRES_URI_POOLING: z.string() },

    /** Also in `@spill-it/ui` */
    ...{
      HOST_API_DEV: z.string().url(),
      HOST_API_PROD: z.string().url(),
      HOST_UI_DEV: z.string().url(),
      HOST_UI_PROD: z.string().url(),
    },
  })
  .safeParse(process.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unexpected API environment variables", parsing.error);

export const apiHost =
  env.NODE_ENV === "development"
    ? env.HOST_API_DEV
    : env.NODE_ENV === "production"
      ? env.HOST_API_PROD
      : raise("Unknown environment for API host");

export const uiHost =
  env.NODE_ENV === "development"
    ? env.HOST_UI_DEV
    : env.NODE_ENV === "production"
      ? env.HOST_UI_PROD
      : raise("Unknown environment for UI host");
