const endpoints = [
  "/",
  "/welcome",
  "/login/google/redirect",
  "/logout",
  "/home",
] as const;
type Endpoint = (typeof endpoints)[number];

export function endpoint<T extends Endpoint>(endpoint: T): T {
  return endpoint;
}
