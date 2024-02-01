import clsx from "clsx";
import { Screen } from "../../components/Screen";
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
    <Screen className="grid place-items-center">
      <GoogleLoginButtonLink />
    </Screen>
  );
}
