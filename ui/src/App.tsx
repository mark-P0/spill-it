import { buildHeaderAuth } from "@spill-it/header-auth";
import { Route, redirect } from "react-router-dom";
import { endpoint } from "./utils/endpoints";
import { fetchAPI } from "./utils/fetch-api";

async function isSessionValid(): Promise<boolean> {
  const id = localStorage.getItem("SPILLITSESS");
  if (id === null) return false;

  const res = await fetchAPI("/api/v0/users/me", {
    headers: {
      Authorization: buildHeaderAuth("SPILLITSESS", { id }),
    },
  });
  if (!res.success) return false;

  return true;
}

export const RootRoute = (
  <Route
    path={endpoint("/")}
    loader={async () => {
      const isValid = await isSessionValid();
      if (isValid) return redirect(endpoint("/home"));
      return redirect(endpoint("/welcome"));
    }}
    element={null}
  />
);
