import { Endpoint } from "@spill-it/endpoints";
import { RouteParameters } from "express-serve-static-core";

export function endpointWithParam<T extends Endpoint>(
  endpoint: T,
  params: RouteParameters<T>,
): string {
  let epActual: string = endpoint;
  for (const [param, value] of Object.entries(params)) {
    epActual = epActual.replace(`:${param}`, value);
  }
  return epActual;
}
