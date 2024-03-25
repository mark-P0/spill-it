import { buildAuthUrl } from "@spill-it/auth/google";
import { ensureError } from "@spill-it/utils/errors";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { E, EE } from "../../utils/dom";
import { env } from "../../utils/env";
import { logger } from "../../utils/logger";
import { useError } from "../../utils/react";
import { Screen } from "../_app/Screen";
import { redirectUri } from "./redirect-uri";

function LoginWithGoogle() {
  const { setError } = useError();
  const [link, setLink] = useState<string | null>(null);
  async function initializeLink() {
    try {
      const link = await buildAuthUrl(
        env.VITE_AUTH_GOOGLE_CLIENT_ID,
        redirectUri,
      );
      setLink(link);
    } catch (caughtError) {
      setError(ensureError(caughtError));
    }
  }
  useEffect(() => {
    initializeLink();

    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once, on initial render...
  }, []);

  const divRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (link === null) return; // Only add script if button is rendered

    const div = divRef.current;
    if (div == null) return;

    logger.debug("Attaching Google script...");
    EE(div, {}, [
      E(
        "script",
        { src: "https://accounts.google.com/gsi/client", async: true },
        [],
      ),
    ]);
  }, [link]);

  if (link === null) return null;
  return (
    <div
      className="flex" // Used to contain Google button as it seems to resize on its own...
    >
      <div className="relative overflow-clip w-min h-min">
        {
          /**
           * Ideally this script element from Google should be used.
           * However React does not seem to "render" script elements,
           * so it is added via regular DOM manipulation into the `<div>` container that follows.
           *
           * The location of the script element does not seem to matter,
           * however it seems to work only if the elements are actually
           * already in the DOM. This can be tricky because of e.g. React rerenders.
           */
          // <script src="https://accounts.google.com/gsi/client" async></script>

          <div ref={divRef}></div>
        }

        {
          /**
           * Can configure the button visually using Google's tool
           *
           * https://developers.google.com/identity/gsi/web/tools/configurator
           */
          <>
            <div
              id="g_id_onload"
              data-client_id={env.VITE_AUTH_GOOGLE_CLIENT_ID}
              // data-login_uri="https://your.domain/your_login_endpoint"
              data-auto_prompt="false" // One-Tap login
            ></div>
            <div
              className="g_id_signin"
              data-type="standard"
              data-theme="outline"
              data-size="large"
              data-text="continue_with"
              data-shape="pill"
              data-logo_alignment="center"
            ></div>
          </>
        }

        {/** The following is laid on top of the Google sign-in button to "override" its behavior. */}
        <a
          href={link}
          className={clsx(
            "absolute top-0 left-0",
            "w-full h-full scale-125", // Scale up to ensure element is covered fully
            "opacity-0", // Should be invisible
          )}
        ></a>
      </div>
    </div>
  );
}

export function WelcomeScreen() {
  document.title = "Welcome! ✨ Spill.it!";

  return (
    <Screen className="grid place-items-center">
      <LoginWithGoogle />
    </Screen>
  );
}
