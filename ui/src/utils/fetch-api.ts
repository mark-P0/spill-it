import {
  Endpoint,
  EndpointResponse,
  mapEndpointResponse,
} from "@spill-it/endpoints";
import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { env } from "./env";

const hostAPI = env.DEV
  ? env.VITE_HOST_API_DEV
  : env.PROD
    ? env.VITE_HOST_API_PROD
    : raise("Impossible situation for API host URL");

export async function fetchAPI<T extends Endpoint>(
  endpoint: T,
  options?: {
    query?: Record<string, string>;
    headers?: Record<string, string>;
  },
): Promise<EndpointResponse<T>> {
  const url = new URL(endpoint, hostAPI);

  // TODO Make combinations of options possible?
  const req = (() => {
    if (options?.query !== undefined) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
      return new Request(url);
    }
    if (options?.headers !== undefined) {
      return new Request(url, { headers: options.headers });
    }

    return new Request(url);
  })();

  const result = await safeAsync(async () => {
    const res = await fetch(req);
    return await res.json();
  });
  const receivedData = result.success
    ? result.value
    : raise("Failed fetching endpoint", result.error);

  const parsing = mapEndpointResponse[endpoint].safeParse(receivedData);
  const data = parsing.success
    ? parsing.data
    : raise("Unexpected data received from endpoint", parsing.error);

  return data;
}
