import { RouteObject } from "react-router-dom";
import { ProfileScreen } from "./[profile]/ProfileScreen";
import { loadProfile, profilePath } from "./[profile]/load-profile";

export const ProfileRoute: RouteObject = {
  path: profilePath,
  loader: loadProfile,
  element: <ProfileScreen />,
};
