import { fetchAPI } from "./fetch-api";

export async function isLoggedIn(): Promise<boolean> {
  const headerAuth = localStorage.getItem("SESS");
  if (headerAuth === null) return false;

  const result = await fetchAPI("/api/v0/users/me", "GET", {
    headers: {
      Authorization: headerAuth,
    },
  });
  if (!result.success) return false;

  return true;
}
