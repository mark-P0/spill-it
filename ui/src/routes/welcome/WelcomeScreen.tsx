import { buildAuthUrl } from "@spill-it/auth/google";
import { ensureError } from "@spill-it/utils/errors";
import { randomChoice } from "@spill-it/utils/random";
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
    <Screen className="grid grid-rows-[4fr_5fr]">
      <div className="mb-6 justify-self-center self-end">
        <figure className="select-none">
          <div className="grid *:row-[1] *:col-[1]">
            <div className="text-6xl animate-welcome-brand [--idx:1]">🍵</div>
            <div className="text-6xl animate-welcome-brand [--idx:2]">💅</div>
            <div className="text-6xl animate-welcome-brand [--idx:3]">✨</div>
            <div className="text-6xl animate-welcome-brand [--idx:4]">🧹</div>
            <div className="text-6xl animate-welcome-brand [--idx:5]">🎊</div>
            <div className="text-6xl animate-welcome-brand [--idx:6]">📢</div>
          </div>
          {/* <div className="aspect-square h-fit">
            <span className="text-6xl">🍵</span>
            <span className="text-6xl">💅</span>
            <span className="text-6xl">✨</span>
            <span className="text-6xl">🧹</span>
            <span className="text-6xl">🎊</span>
            <span className="text-6xl">📢</span>
          </div> */}
          <figcaption className="sr-only">Spill.it logo</figcaption>
        </figure>
      </div>

      <div className="justify-self-center">
        <header className="mb-6">
          <h1 className="mb-1 text-center text-3xl font-bold tracking-wide">
            The most sublime tea 😋
          </h1>
          <p className="text-center text-xl italic text-white/50">
            {randomChoice([
              <>Throw mean shades</>,
              <>Serve your realness</>,
              <>Dig up dirt</>,
              <>Tell tattle tales</>,
              <>Show some sass</>,
            ])}
          </p>
        </header>

        <main>
          <h2 className="mb-3 text-center">
            Are you ready to <span className="font-bold">spill it</span>?
          </h2>
          <div className="w-min mx-auto">
            <LoginWithGoogle />
          </div>
        </main>
      </div>
    </Screen>
  );
}
