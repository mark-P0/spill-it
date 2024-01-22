import { buildHeaderAuth } from "@spill-it/header-auth";
import { raise } from "@spill-it/utils/errors";
import { useEffect, useState } from "react";
import { Route, redirect } from "react-router-dom";
import { z } from "zod";
import { env } from "../utils/env";
import { fetchAPI } from "../utils/fetch-api";

const hostUI = env.DEV
  ? env.VITE_HOST_UI_DEV
  : env.PROD
    ? env.VITE_HOST_UI_PROD
    : raise("Impossible situation for UI host URL");

// TODO Centralize definitions for UI endpoints? Like in the API
const redirectUri = new URL("/login/google/redirect", hostUI).href;

function GoogleLoginButtonLink() {
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const res = await fetchAPI("/api/v0/links/google", {
        query: { redirectUri },
      });
      // TODO What if this failed?
      if (res.success) {
        setLink(res.link);
      }
    })();
  }, []);

  if (link === null) return null;
  return (
    <a href={link} className="bg-white text-black px-3 py-2 rounded">
      Login with Google
    </a>
  );
}

function WelcomeScreen() {
  return (
    <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
      <GoogleLoginButtonLink />
    </main>
  );
}

export const WelcomeRoute = (
  <Route path="/welcome" element={<WelcomeScreen />} />
);

export const LoginGoogleRedirectRoute = (
  <Route
    path="/login/google/redirect"
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
        const res = await fetchAPI("/api/v0/sessions", {
          headers: {
            Authorization: buildHeaderAuth("SPILLITGOOGLE", {
              code,
              redirectUri,
            }),
          },
        });

        // TODO What if this failed?
        if (res.success) {
          const { scheme, id } = res.data;
          // TODO Create util wrapper for local storage, also using Zod?
          // TODO Find better alternative to local storage...
          localStorage.setItem(scheme, id);
        }
      }

      return redirect("/");
    }}
    element={null}
  />
);
