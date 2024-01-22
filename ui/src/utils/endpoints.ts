const endpoints = ["/", "/welcome", "/login/google/redirect", "/home"] as const;
type Endpoint = (typeof endpoints)[number];

export function endpoint<T extends Endpoint>(endpoint: T): T {
  return endpoint;
}
