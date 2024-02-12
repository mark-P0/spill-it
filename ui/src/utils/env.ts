import { raise } from "@spill-it/utils/errors";
import { zodOfType } from "@spill-it/utils/zod";
import { LevelWithSilent } from "pino";
import { z } from "zod";

const zodPinoLevel = zodOfType<LevelWithSilent>()(
  z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),
);
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

    /** Prefixed with `VITE` to be included in the build */
    ...{
      VITE_PINO_LEVEL: zodPinoLevel,

      // TODO Hide dev hosts? e.g. by removing prefixes?
      /** Also in `@spill-it/api` */
      ...{
        VITE_AUTH_GOOGLE_CLIENT_ID: z.string(),
        VITE_HOST_API_DEV: z.string().url(),
        VITE_HOST_API_PROD: z.string().url(),
        VITE_HOST_UI_DEV: z.string().url(),
        VITE_HOST_UI_PROD: z.string().url(),
      },
    },
  })
  .safeParse(import.meta.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unexpected UI environment variables", parsing.error);

export const apiHost = env.DEV
  ? env.VITE_HOST_API_DEV
  : env.PROD
    ? env.VITE_HOST_API_PROD
    : raise("Unknown environment for API host");

export const uiHost = env.DEV
  ? env.VITE_HOST_UI_DEV
  : env.PROD
    ? env.VITE_HOST_UI_PROD
    : raise("Unknown environment for UI host");
