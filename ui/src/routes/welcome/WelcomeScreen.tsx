import { raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { isLoggedIn } from "../../utils/is-logged-in";
import { createNewContext } from "../../utils/react";
import { redirectUri } from "./load-welcome-route";

function GoogleLoginButtonLink() {
  const { link } = useWelcomeContext();

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

function WelcomeScreen() {
  return (
    <div className={clsx("h-full", "grid place-items-center")}>
      <GoogleLoginButtonLink />
    </div>
  );
}

const [useWelcomeContext, WelcomeProvider] = createNewContext(() => {
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      /** Fetch login link from API */
      {
        const result = await fetchAPI("/api/v0/links/google", "GET", {
          query: { redirectUri },
        });
        const output = result.success
          ? result.value
          : raise("Failed fetching login link", result.error);

        const link = output.link;
        setLink(link);
      }
    })();
  });

  return { link };
});

export function LoadWelcomeRoute() {
  const navigate = useNavigate();
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    (async () => {
      /** Redirect if already logged in */
      {
        const canShowHome = await isLoggedIn();
        if (canShowHome) {
          return navigate(endpoint("/home"));
        }
      }

      setCanProceed(true);
    })();
  }, [navigate]);

  if (!canProceed) return null;
  return (
    <WelcomeProvider>
      <WelcomeScreen />
    </WelcomeProvider>
  );
}
