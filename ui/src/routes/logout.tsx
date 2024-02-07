import { RouteObject, redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";
import { deleteFromStorage } from "../utils/storage";

export const LogoutRoute: RouteObject = {
  path: endpoint("/logout"),
  loader() {
    deleteFromStorage("SESS");
    return redirect(endpoint("/"));
  },
  element: null,
};
