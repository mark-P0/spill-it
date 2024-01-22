import {
  Endpoint,
  EndpointResponse,
  mapEndpointResponse,
} from "@spill-it/endpoints";
import { buildHeaderAuth } from "@spill-it/header-auth";
import { raise } from "@spill-it/utils/errors";
import { useEffect, useState } from "react";
import { Route, redirect } from "react-router-dom";
import { z } from "zod";

// TODO Move to utils?
const env = z
  .object({
    /** Guaranteed from Vite (https://vitejs.dev/guide/env-and-mode) */
    ...{
      MODE: z.string(),
      BASE_URL: z.string(),
      PROD: z.boolean(),
      DEV: z.boolean(),
      SSR: z.boolean(),
    },

    // TODO Hide dev hosts? e.g. by removing prefixes?
    /** Prefix with `VITE` to be included in the build */
    VITE_HOST_UI_DEV: z.string().url(),
    VITE_HOST_UI_PROD: z.string().url(),
    VITE_HOST_API_DEV: z.string().url(),
    VITE_HOST_API_PROD: z.string().url(),
  })
  .parse(import.meta.env);

const hostAPI = env.DEV
  ? env.VITE_HOST_API_DEV
  : env.PROD
    ? env.VITE_HOST_API_PROD
    : raise("Impossible situation for API host URL");
async function fetchAPI<T extends Endpoint>(
  endpoint: T,
  options?: {
    query?: Record<string, string>;
    headers?: Record<string, string>;
  },
): Promise<EndpointResponse<T>> {
  const url = new URL(endpoint, hostAPI);

  // TODO Make combinations of options possible?
  const req = (() => {
    if (options?.query !== undefined) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
      return new Request(url);
    }
    if (options?.headers !== undefined) {
      return new Request(url, { headers: options.headers });
    }

    return new Request(url);
  })();

  const res = await fetch(req);
  const receivedData = await res.json();
  const parsing = mapEndpointResponse[endpoint].safeParse(receivedData);
  const data = parsing.success
    ? parsing.data
    : raise("Unexpected data received from endpoint", parsing.error);

  return data;
}

const hostUI = env.DEV
  ? env.VITE_HOST_UI_DEV
  : env.PROD
    ? env.VITE_HOST_UI_PROD
    : raise("Impossible situation for UI host URL");

// TODO Centralize definitions for UI endpoints? Like in the API
const redirectUri = new URL("/login/google/redirect", hostUI).href;

export const LoginGoogleRedirectRoute = (
  <Route
    path="/login/google/redirect"
    element={null}
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

      /* Convert authorization code to session ID */
      const res = await fetchAPI("/api/v0/sessions", {
        headers: {
          Authorization: buildHeaderAuth("SPILLITGOOGLE", {
            code,
            redirectUri,
          }),
        },
      });

      /* Save session ID locally, e.g. local storage? */
      // TODO What if this failed?
      if (res.success) {
        const { scheme, id } = res.data;
        // TODO Create util wrapper for local storage, also using Zod?
        // TODO Find better alternative to local storage...
        localStorage.setItem(scheme, id);
      }

      /* Redirect to home page */
      return redirect("/");
    }}
  />
);

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

export function App() {
  const [screen, setScreen] = useState<null | "welcome" | "home">(null);
  useEffect(() => {
    (async () => {
      if (await isSessionValid()) {
        setScreen("home");
      } else {
        setScreen("welcome");
      }
    })();
  }, []);

  if (screen === "welcome") {
    return (
      <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
        <GoogleLoginButtonLink />
      </main>
    );
  }
  if (screen === "home") {
    return (
      <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
        Home page
      </main>
    );
  }
  return null;
}
