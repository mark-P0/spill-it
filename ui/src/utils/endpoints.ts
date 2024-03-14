import { Params, PathParam } from "react-router-dom";
import { logger } from "./logger";

const endpoints = [
  "/",
  "/welcome",
  "/login/google/redirect",
  "/logout",
  "/home",
  ...[
    "/:username",
    "/:username/followers",
    "/:username/following",
    "/:username/edit",
  ],
  ...["/users"],
] as const;
type Endpoint = (typeof endpoints)[number];

export function endpoint<T extends Endpoint>(endpoint: T): T {
  return endpoint;
}

/** Because "optional properties" are different from "undefined" types, and `Required<>` only works with the former */
type Defined<T extends Record<string, unknown>> = {
  [Key in keyof T]: NonNullable<T[Key]>;
};
/** Used for the same functions as `RouteParameters<>` in `@types/express-serve-static-core` */
export type EndpointParams<T extends Endpoint> = Defined<Params<PathParam<T>>>;
export function endpointWithParam<T extends Endpoint>(
  endpoint: T,
  params: EndpointParams<T>,
): string {
  let epActual: string = endpoint;
  for (const [param, value] of Object.entries(params)) {
    /** Should not be possible as `params` should be something like `Record<string, string>` */
    if (typeof value !== "string") {
      logger.warn("Non-string parameter encountered; ignoring...");
      continue;
    }

    epActual = epActual.replace(`:${param}`, value);
  }
  return epActual;
}
