import { RouteObject } from "react-router-dom";
import { ErrorScreen } from "./_app/ErrorScreen";

export const AppRoute = ({ children }: RouteObject): RouteObject => ({
  errorElement: <ErrorScreen />,
  children,
});
