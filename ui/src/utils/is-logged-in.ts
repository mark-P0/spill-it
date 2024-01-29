import { buildHeaderAuth } from "@spill-it/header-auth";
import { fetchAPI2 } from "./fetch-api2";

export async function isLoggedIn(): Promise<boolean> {
  const id = localStorage.getItem("SPILLITSESS");
  if (id === null) return false;

  const result = await fetchAPI2("/api/v0/users/me", "GET", {
    headers: {
      Authorization: buildHeaderAuth("SPILLITSESS", { id }),
    },
  });
  if (!result.success) return false;

  return true;
}
