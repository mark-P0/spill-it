import { RouteObject, redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";
import { isLoggedIn } from "../utils/is-logged-in";
import { HomeScreen } from "./home/HomeScreen";

export const HomeRoute: RouteObject = {
  path: endpoint("/home"),
  async loader() {
    document.title = "Home 🍵 Spill.it!";

    const canShowHome = await isLoggedIn();
    if (!canShowHome) {
      return redirect(endpoint("/welcome"));
    }

    return null;
  },
  element: <HomeScreen />,
};
