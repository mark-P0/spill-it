import clsx from "clsx";
import { Link, useRouteError } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { Screen } from "./Screen";

export function ErrorScreen() {
  document.title = "Oops! 😬 Spill.it";

  const error = useRouteError();
  console.error(error);

  return (
    <Screen className="grid place-content-center text-center">
      <h1 className="mb-6 text-6xl font-bold tracking-wider">😬</h1>
      <p>
        <span className="text-white/50">
          This tea may have been cleaned up the fun police.
        </span>
        <br />
        <Link
          to={endpoint("/")}
          className={clsx(
            "underline underline-offset-4",
            ...["transition", "hover:text-fuchsia-500"],
          )}
        >
          Go back
        </Link>{" "}
        before they see you 🚨
      </p>
    </Screen>
  );
}
