import { raise } from "@spill-it/utils/errors";
import { redirect } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { uiHost } from "../../utils/env";
import { fetchAPI } from "../../utils/fetch-api";
import { isLoggedIn } from "../../utils/is-logged-in";

export const redirectUri = new URL(endpoint("/login/google/redirect"), uiHost)
  .href;

export type WelcomeRouteLoader = typeof loadWelcomeRoute;
export async function loadWelcomeRoute() {
  /** Redirect if already logged in */
  {
    const canShowHome = await isLoggedIn();
    if (canShowHome) {
      return redirect(endpoint("/home"));
    }
  }

  /** Fetch login link from API */
  {
    const result = await fetchAPI("/api/v0/links/google", "GET", {
      query: { redirectUri },
    });
    const output = result.success
      ? result.value
      : raise("Failed fetching login link", result.error);

    const link = output.link;

    return { link };
  }
}
