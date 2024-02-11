import { MatchValueCallback } from "date-fns";
import { Params, PathParam } from "react-router-dom";

const endpoints = [
  "/",
  "/welcome",
  "/login/google/redirect",
  "/logout",
  "/home",
  "/:username",
] as const;
type Endpoint = (typeof endpoints)[number];

export function endpoint<T extends Endpoint>(endpoint: T): T {
  return endpoint;
}

/** Because `Required<>` is not "deep" */
type Defined<T extends Record<string, unknown>> = {
  [Key in keyof T]: NonNullable<T[Key]>;
};
/** Used for the same functions as `RouteParameters<>` in `@types/express-serve-static-core` */
type EndpointParams<T extends string> = Defined<Params<PathParam<T>>>;
export function endpointWithParam<T extends Endpoint>(
  endpoint: T,
  params: EndpointParams<T>,
): string {
  let epActual: string = endpoint;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TypeScript has trouble with `Object.entries()` and `params`...
  for (const [param, value] of Object.entries(params) as any) {
    epActual = epActual.replace(`:${param}`, value);
  }
  return epActual;
}
