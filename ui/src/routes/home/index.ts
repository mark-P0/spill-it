import { redirect } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { isLoggedIn } from "../../utils/is-logged-in";

export * from "./HomeScreen";

export async function loadHome() {
  const canShowHome = await isLoggedIn();
  if (!canShowHome) {
    return redirect(endpoint("/welcome"));
  }

  return null;
}
