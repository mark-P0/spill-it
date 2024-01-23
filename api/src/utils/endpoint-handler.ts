// TODO Delete source from shared endpoints package

import { Endpoint, EndpointResponse } from "@spill-it/endpoints";
import { RequestHandler } from "express";
import { RouteParameters } from "express-serve-static-core";

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

export function endpointHandler<T extends Endpoint, U = EndpointHandler<T>>(
  endpoint: T,
  handler: U,
): [T, U] {
  return [endpoint, handler];
}
