import { RouteObject, redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";
import { isLoggedIn } from "../utils/is-logged-in";

export const RootRoute: RouteObject = {
  path: endpoint("/"),
  async loader() {
    const canShowHome = await isLoggedIn();
    if (canShowHome) {
      return redirect(endpoint("/home"));
    }

    return redirect(endpoint("/welcome"));
  },
  element: null,
};
