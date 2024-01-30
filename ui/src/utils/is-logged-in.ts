import { buildHeaderAuth } from "@spill-it/header-auth";
import { raise } from "@spill-it/utils/errors";
import { safe } from "@spill-it/utils/safe";
import { fetchAPI } from "./fetch-api";

// TODO Export this from storage util?
export function buildHeaderAuthFromStorage(): string {
  const id =
    localStorage.getItem("SPILLITSESS") ?? raise("Session ID does not exist!");
  return buildHeaderAuth("SPILLITSESS", { id });
}

export async function isLoggedIn(): Promise<boolean> {
  const headerAuthResult = safe(() => buildHeaderAuthFromStorage());
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
