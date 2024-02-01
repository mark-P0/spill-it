import { RouteObject } from "react-router-dom";
import { ErrorScreen } from "./_app/ErrorScreen";
import { Layout } from "./_app/Layout";

export const AppRoute = ({ children }: RouteObject): RouteObject => ({
  element: <Layout />,
  errorElement: <ErrorScreen />,
  children,
});
