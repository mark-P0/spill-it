import clsx from "clsx";
import { Route, redirect, useRouteError } from "react-router-dom";
import { endpoint } from "./utils/endpoints";
import { isLoggedIn } from "./utils/is-logged-in";

export function ErrorScreen() {
  const error = useRouteError();
  console.error(error);

  return (
    <main
      className={clsx(
        "h-screen w-screen",
        "grid place-items-center",
        "bg-stone-700 text-white",
      )}
    >
      Sorry! We spilt too much. Please try again!
    </main>
  );
}

export const RootRoute = () => (
  <Route
    path={endpoint("/")}
    loader={async () => {
      const canShowHome = await isLoggedIn();
      if (canShowHome) {
        return redirect(endpoint("/home"));
      }

      return redirect(endpoint("/welcome"));
    }}
    element={null}
  />
);
