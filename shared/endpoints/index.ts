import { RequestHandler } from "express";
import { RouteParameters } from "express-serve-static-core";
import { z } from "zod";

// DELETEME Use endpoint map with type helpers
/**
 * - Try to keep "sorted"
 * - Group related routes as much as possible
 */
export const endpoints = [
  ...["/api/v0/users/me", "/api/v0/sessions"],
  ...[
    "/try/hello",
    "/try/sample",
    "/try/protected",
    "/try/unprotected",
    "/try/not-found",
    "/try/error",
    "/try/ui/login/google",
    "/try/ui/login/google/redirect",
  ],
] as const;
type Endpoint = (typeof endpoints)[number];
export function endpoint<T extends Endpoint>(endpoint: T): T {
  return endpoint;
}

function objectKeys<T extends Record<string, unknown>, Key = keyof T>(
  object: T
): Key[] {
  return Object.keys(object) as Key[]; // TYPE ASSERTION Object.keys returns a non-specific type because of heavily contested reasons
}

// TODO Use common error "shape"?
// TODO Use "standard"? e.g. JSON:API, JSend
// TODO Boolean discriminator only provides 2 possibilities...
// TODO Map each possible response to a status code?
const mapEndpointResponse = {
  "/api/v0/sessions": z.discriminatedUnion("success", [
    z.object({ success: z.literal(false), error: z.string() }),
    z.object({
      success: z.literal(true),
      data: z.object({
        scheme: z.string(),
        id: z.string(),
      }),
    }),
  ]),
  "/api/v0/users/me": z.discriminatedUnion("success", [
    z.object({ success: z.literal(false), error: z.string() }),
  ]),
  "/try/hello": z.object({ hello: z.string() }),
  "/try/sample": z.object({ data: z.any() }),
  "/try/not-found": z.never(),
  "/try/error": z.never(),
  "/try/unprotected": z.object({
    data: z.object({
      resource: z.string(),
      access: z.literal(true),
    }),
  }),
  "/try/protected": z.discriminatedUnion("success", [
    z.object({ success: z.literal(false), error: z.string() }),
    z.object({
      success: z.literal(true),
      data: z.object({
        resource: z.string(),
        access: z.string(),
      }),
    }),
  ]),
  "/try/ui/login/google": z.object({
    redirect: z.string().url(),
  }),
  "/try/ui/login/google/redirect": z.discriminatedUnion("success", [
    z.object({ success: z.literal(false), error: z.string() }),
    z.object({
      success: z.literal(true),
      data: z.object({
        code: z.string(),
        redirectUri: z.string(),
      }),
      headers: z.object({
        Authorization: z.string(),
      }),
    }),
  ]),
} as const;
type MapEndpointResponse = typeof mapEndpointResponse;
type Endpoint2 = keyof MapEndpointResponse;
type EndpointResponse<T extends Endpoint2> = z.infer<MapEndpointResponse[T]>;

/* TODO Add source code line */
type EndpointHandler<T extends Endpoint2> = RequestHandler<
  RouteParameters<T>,
  EndpointResponse<T>
>;

export const endpoints2 = objectKeys(mapEndpointResponse);

// TODO Replace the original above
export function endpoint2<T extends Endpoint2>(endpoint: T): T {
  return endpoint;
}

export function endpointHandler<T extends Endpoint2, U = EndpointHandler<T>>(
  endpoint: T,
  handler: U
): [T, U] {
  return [endpoint, handler];
}
