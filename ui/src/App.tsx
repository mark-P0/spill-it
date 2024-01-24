import { Route, redirect } from "react-router-dom";
import { endpoint } from "./utils/endpoints";
import { isLoggedIn } from "./utils/is-logged-in";

export function ErrorScreen() {
  return (
    <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
      Sorry! We spilt too much. Please try again!
    </main>
  );
}

export const RootRoute = () => (
  <Route
    path={endpoint("/")}
    loader={async () => {
      if (await isLoggedIn()) return redirect(endpoint("/home"));
      return redirect(endpoint("/welcome"));
    }}
    element={null}
  />
);
