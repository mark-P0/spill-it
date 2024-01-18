/**
 * - Try to keep "sorted"
 * - Group related routes as much as possible
 */
const endpoints = [
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
