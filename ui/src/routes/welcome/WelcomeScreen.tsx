import clsx from "clsx";
import { useTypedLoaderData } from "../../utils/react";
import { loadWelcomeRoute } from "./load-welcome-route";

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

export function WelcomeScreen() {
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
