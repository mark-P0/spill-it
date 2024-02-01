import { buildHeaderAuth } from "@spill-it/header-auth";
import { raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { RouteObject, redirect } from "react-router-dom";
import { z } from "zod";
import { endpoint } from "../utils/endpoints";
import { fetchAPI } from "../utils/fetch-api";
import { useTypedLoaderData } from "../utils/react";
import { loadWelcomeRoute, redirectUri } from "./welcome/load-welcome-route";

function GoogleLoginButtonLink() {
  const { link } = useTypedLoaderData<typeof loadWelcomeRoute>();

  return (
    <a
      href={link}
      className={clsx("bg-white text-black", "rounded-full px-6 py-3")}
    >
      Login with Google
    </a>
  );
}

function WelcomeScreen() {
  return (
    <main
      className={clsx(
        "h-screen w-screen",
        "grid place-items-center",
        "bg-stone-700 text-white",
      )}
    >
      <GoogleLoginButtonLink />
    </main>
  );
}

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
      const { data } = result.success
        ? result.value
        : raise("Failed retrieving session ID", result.error);
      const { scheme, id } = data;

      // TODO Create util wrapper for local storage, also using Zod?
      // TODO Find better alternative to local storage...
      localStorage.setItem(scheme, id);
    }

    return redirect(endpoint("/"));
  },
  element: null,
};
