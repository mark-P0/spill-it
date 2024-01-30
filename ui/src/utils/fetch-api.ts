import {
  Endpoint,
  EndpointInput,
  EndpointMethod,
  EndpointOutput,
  endpointMap,
} from "@spill-it/endpoints";
import { ensureError, raise } from "@spill-it/utils/errors";
import { Result } from "@spill-it/utils/safe";
import { parse as jsonUnpack } from "superjson";
import { env } from "./env";

const hostAPI = env.DEV
  ? env.VITE_HOST_API_DEV
  : env.PROD
    ? env.VITE_HOST_API_PROD
    : raise("Impossible situation for API host URL");

function buildRequestFromInput<T extends Endpoint>(
  endpoint: T,
  method: EndpointMethod<T>,
  input: Record<string, Record<string, string>>, // Could be `EndpointInput<T, U>` but that goes crazy...
): Request {
  const url = new URL(endpoint, hostAPI);
  const options: RequestInit = {};

  options.method =
    typeof method === "string"
      ? method
      : raise(`Unknown method ${String(method)} against endpoint ${endpoint}`);

  if (input?.query !== undefined) {
    for (const [key, value] of Object.entries(input.query)) {
      url.searchParams.set(key, value);
    }
  }
  if (input?.headers !== undefined) {
    options.headers = input.headers;
  }
  if (input?.body !== undefined) {
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };

    options.body = JSON.stringify(input.body); // TODO Use `superjson`?
  }

  return new Request(url.href, options);
}

export async function fetchAPI<T extends Endpoint, U extends EndpointMethod<T>>(
  endpoint: T,
  method: U,
  rawInput: EndpointInput<T, U>,
): Promise<Result<EndpointOutput<T, U>>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Something about TypeScript does not work after 2 indices...
    const signature = endpointMap[endpoint][method] as any;

    const input = signature.input.parse(rawInput);
    const req = buildRequestFromInput(endpoint, method, input);

    const res = await fetch(req);
    if (endpoint === "/api/v0/posts") {
      const rawOutput = await res.text();
      const output = signature.output.parse(jsonUnpack(rawOutput));
      return { success: true, value: output };
    }
    const rawOutput = await res.json();
    const output = signature.output.parse(rawOutput);
    return { success: true, value: output };
  } catch (caughtError) {
    const error = new Error("Failed fetching from API", {
      cause: ensureError(caughtError),
    });
    return { success: false, error };
  }
}
