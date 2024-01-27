import { Route, redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";
import { isLoggedIn } from "../utils/is-logged-in";

function HomeScreen() {
  return (
    <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
      Home page
    </main>
  );
}

export const HomeRoute = () => (
  <Route
    path={endpoint("/home")}
    loader={async () => {
      const canShowHome = await isLoggedIn();
      if (!canShowHome) {
        return redirect(endpoint("/welcome"));
      }

      return null;
    }}
    element={<HomeScreen />}
  />
);
