import { RouteObject, redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";

export const RootRoute: RouteObject = {
  path: endpoint("/"),
  loader() {
    return redirect(endpoint("/home"));
  },
  element: null,
};
