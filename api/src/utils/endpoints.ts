import {
  Endpoint,
  EndpointInput,
  EndpointMethod,
  endpointMap,
} from "@spill-it/endpoints";
import { ensureError } from "@spill-it/utils/errors";
import { Result } from "@spill-it/utils/safe";
import { Request } from "express";

export function parseInputFromRequest<
  T extends Endpoint,
  U extends EndpointMethod<T>,
>(endpoint: T, method: U, req: Request): Result<EndpointInput<T, U>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Something about TypeScript does not work after 2 indices...
    const signature = endpointMap[endpoint][method] as any;

    const rawInput = {
      headers: req.headers,
      query: req.query,
      body: req.body,
    };
    const input = signature.input.parse(rawInput);
    return { success: true, value: input };
  } catch (caughtError) {
    const error = new Error("Failed parsing input from request", {
      cause: ensureError(caughtError),
    });
    return { success: false, error };
  }
}
