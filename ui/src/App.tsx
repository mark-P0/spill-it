import { Route, redirect } from "react-router-dom";
import { endpoint } from "./utils/endpoints";
import { isLoggedIn } from "./utils/is-logged-in";

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
