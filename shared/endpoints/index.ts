import { RequestHandler } from "express";
import { RouteParameters } from "express-serve-static-core";
import { z } from "zod";

function objectKeys<T extends Record<string, unknown>, Key = keyof T>(
  object: T,
): Key[] {
  return Object.keys(object) as Key[]; // TYPE ASSERTION Object.keys returns a non-specific type because of heavily contested reasons
}

// TODO Use common error "shape"?
// TODO Use "standard"? e.g. JSON:API, JSend
// TODO Boolean discriminator only provides 2 possibilities...
// TODO Map each possible response to a status code?
/**
 * - Try to keep "sorted"
 * - Group related routes as much as possible
 */
export const mapEndpointResponse = {
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
    // TODO Move database fetching to shared package?
    // TODO Get type from database schema?
    z.object({ success: z.literal(true), data: z.any() }),
  ]),
  "/api/v0/links/google": z.discriminatedUnion("success", [
    z.object({ success: z.literal(false), error: z.string() }),
    z.object({ success: z.literal(true), link: z.string().url() }),
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
export type Endpoint = keyof MapEndpointResponse;
export type EndpointResponse<T extends Endpoint> = z.infer<
  MapEndpointResponse[T]
>;

/**
 * - Response type can be provided on `RequestHandler` via the second generic parameter `ResBody`
 *   - `ResBody` is used as the argument type of the `Response` "closing" methods, e.g. `res.json()`
 *   - https://github.com/DefinitelyTyped/DefinitelyTyped/blob/942c50bb4d57679ca1dcb210f4984b41e7bbfdbb/types/express-serve-static-core/index.d.ts
 *       #L52
 *       #L364
 *       #L724
 * - Generics of `RequestHandler` are optional, but optional generics cannot be "skipped" unlike JS
 *   - In JS, skip optional parameters with `undefined`, e.g. `JSON.stringify(object, undefined, 2)`
 * - The first generic parameter of `RequestHandler` is (can be?) given by a router matcher, e.g. `Router().get`
 *   - https://github.com/DefinitelyTyped/DefinitelyTyped/blob/942c50bb4d57679ca1dcb210f4984b41e7bbfdbb/types/express-serve-static-core/index.d.ts#L118
 * - The generic default type can be imported from `'express-serve-static-core'`
 *   - This is available on `@types/express-serve-static-core` and NOT just `'express-serve-static-core'`
 */
type EndpointHandler<T extends Endpoint> = RequestHandler<
  RouteParameters<T>,
  EndpointResponse<T>
>;

export const endpoints = objectKeys(mapEndpointResponse);

export function endpoint<T extends Endpoint>(endpoint: T): T {
  return endpoint;
}

export function endpointHandler<T extends Endpoint, U = EndpointHandler<T>>(
  endpoint: T,
  handler: U,
): [T, U] {
  return [endpoint, handler];
}
