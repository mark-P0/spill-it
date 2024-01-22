import { raise } from "@spill-it/utils/errors";
import { z } from "zod";

const parsing = z
  .object({
    /** Guaranteed from Vite (https://vitejs.dev/guide/env-and-mode) */
    ...{
      MODE: z.string(),
      BASE_URL: z.string(),
      PROD: z.boolean(),
      DEV: z.boolean(),
      SSR: z.boolean(),
    },

    // TODO Hide dev hosts? e.g. by removing prefixes?
    /** Prefix with `VITE` to be included in the build */
    VITE_HOST_UI_DEV: z.string().url(),
    VITE_HOST_UI_PROD: z.string().url(),
    VITE_HOST_API_DEV: z.string().url(),
    VITE_HOST_API_PROD: z.string().url(),
  })
  .safeParse(import.meta.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unexpected environment variables", parsing.error);
