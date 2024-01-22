import { raise } from "@spill-it/utils/errors";
import { useEffect, useState } from "react";
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

export function WelcomeScreen() {
  return (
    <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
      <GoogleLoginButtonLink />
    </main>
  );
}
