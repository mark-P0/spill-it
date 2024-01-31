import { buildHeaderAuth } from "@spill-it/header-auth";
import { raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import {
  LoaderFunction,
  Route,
  redirect,
  useLoaderData,
} from "react-router-dom";
import { z } from "zod";
import { endpoint } from "../utils/endpoints";
import { uiHost } from "../utils/env";
import { fetchAPI } from "../utils/fetch-api";
import { isLoggedIn } from "../utils/is-logged-in";

/**
 * - https://stackoverflow.com/q/74877170
 * - https://github.com/remix-run/react-router/discussions/9792
 */
type LoaderData<TLoader extends LoaderFunction> =
  Awaited<ReturnType<TLoader>> extends Response | infer D ? D : never;
function useTypedLoaderData<TLoader extends LoaderFunction>() {
  return useLoaderData() as LoaderData<TLoader>;
}

const redirectUri = new URL(endpoint("/login/google/redirect"), uiHost).href;

function GoogleLoginButtonLink() {
  const { link } = useTypedLoaderData<WelcomeRouteLoader>();

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

type WelcomeRouteLoader = typeof loadWelcomeRoute;
async function loadWelcomeRoute() {
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
export const WelcomeRoute = () => (
  <Route
    path={endpoint("/welcome")}
    loader={loadWelcomeRoute}
    element={<WelcomeScreen />}
  />
);

export const LoginGoogleRedirectRoute = () => (
  <Route
    path={endpoint("/login/google/redirect")}
    loader={async ({ request }) => {
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
    }}
    element={null}
  />
);
