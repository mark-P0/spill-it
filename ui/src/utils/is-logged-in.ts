import { safe } from "@spill-it/utils/safe";
import { fetchAPI } from "./fetch-api";
import { getFromStorage } from "./storage";

export async function isLoggedIn(): Promise<boolean> {
  const headerAuthResult = safe(() => getFromStorage("SESS"));
  if (!headerAuthResult.success) return false;
  const headerAuth = headerAuthResult.value;

  const result = await fetchAPI("/api/v0/users/me", "GET", {
    headers: {
      Authorization: headerAuth,
    },
  });
  if (!result.success) return false;

  return true;
}
