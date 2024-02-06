import { raise } from "@spill-it/utils/errors";
import { z } from "zod";

const parsing = z
  .object({
    /** Also in `@spill-it/api` */
    ...{
      AUTH_GOOGLE_CLIENT_ID: z.string(),
      AUTH_GOOGLE_CLIENT_SECRET: z.string(),
    },
  })
  .safeParse(process.env);
export const env = parsing.success
  ? parsing.data
  : raise("Unexpected DB environment variables", parsing.error);
