import { buildHeaderAuth } from "@spill-it/auth/headers";
import { raise } from "@spill-it/utils/errors";
import { RouteObject, redirect } from "react-router-dom";
import { z } from "zod";
import { endpoint } from "../utils/endpoints";
import { fetchAPI } from "../utils/fetch-api";
import { WelcomeScreen } from "./welcome/WelcomeScreen";
import { loadWelcomeRoute, redirectUri } from "./welcome/load-welcome-route";

export const WelcomeRoute: RouteObject = {
  path: endpoint("/welcome"),
  loader: loadWelcomeRoute,
  element: <WelcomeScreen />,
};

export const LoginGoogleRedirectRoute: RouteObject = {
  path: endpoint("/login/google/redirect"),
  async loader({ request }) {
    /** https://github.com/remix-run/react-router/issues/9171#issuecomment-1220717197 */
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const parsing = z.object({ code: z.string() }).safeParse(query);
    const { code } = parsing.success
      ? parsing.data
      : raise(
          "Unexpected query params received on Google login redirect route",
          parsing.error,
        );

    /** Convert authorization code to session ID */
    {
      const result = await fetchAPI("/api/v0/sessions", "GET", {
        headers: {
          Authorization: buildHeaderAuth("SPILLITGOOGLE", {
            code,
            redirectUri,
          }),
        },
      });
      const { Authorization } = result.success
        ? result.value
        : raise("Failed retrieving session authorization", result.error);

      // TODO Create util wrapper for local storage, also using Zod?
      // TODO Find better alternative to local storage...
      localStorage.setItem("SESS", Authorization);
    }

    return redirect(endpoint("/"));
  },
  element: null,
};
