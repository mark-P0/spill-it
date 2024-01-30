import { raise } from "@spill-it/utils/errors";
import { env } from "./env";

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
