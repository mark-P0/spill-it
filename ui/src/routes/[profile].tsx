import { RouteObject } from "react-router-dom";
import { endpoint } from "../utils/endpoints";

export const HomeRoute: RouteObject = {
  path: endpoint("/:username"),
  //   async loader() {
  //     document.title = "Home 🍵 Spill.it!";
  //
  //     const canShowHome = await isLoggedIn();
  //     if (!canShowHome) {
  //       return redirect(endpoint("/welcome"));
  //     }
  //
  //     return null;
  //   },
  //   element: <HomeScreen />,
};
