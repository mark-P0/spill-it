import { buildAuthUrl } from "@spill-it/auth/google";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { env } from "../../utils/env";
import { Screen } from "../_app/Screen";
import { redirectUri } from "./redirect-uri";

function GoogleLoginButtonLink() {
  const [link, setLink] = useState<string | null>(null);
  async function initializeLink() {
    const link = await buildAuthUrl(
      env.VITE_AUTH_GOOGLE_CLIENT_ID,
      redirectUri,
    );
    setLink(link);
  }
  useEffect(() => {
    initializeLink();
  }, []);

  if (link === null) return null;
  return (
    <a
      href={link}
      className={clsx("bg-white text-black", "rounded-full px-6 py-3")}
    >
      Login with Google
    </a>
  );
}

export function WelcomeScreen() {
  return (
    <Screen className="grid place-items-center">
      <GoogleLoginButtonLink />
    </Screen>
  );
}
