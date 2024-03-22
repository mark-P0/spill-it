import { safe } from "@spill-it/utils/safe";
import { fetchAPI } from "./fetch-api";
import { logger } from "./logger";
import { getFromStorage } from "./storage";

export async function isLoggedIn(): Promise<boolean> {
  const headerAuthResult = safe(() => getFromStorage("SESS"));
  if (!headerAuthResult.success) {
    logger.warn("No session stored; assuming not logged in...");
    return false;
  }
  const headerAuth = headerAuthResult.value;

  const result = await fetchAPI("/api/v0/users/me", "GET", {
    headers: {
      Authorization: headerAuth,
    },
  });
  if (!result.success) {
    logger.warn("Failed fetching user info; assuming not logged in...");
    return false;
  }

  return true;
}
