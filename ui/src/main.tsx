import React from "react";
import ReactDOM from "react-dom/client";
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import "./assets/tailwind.css";
import { AppRoute } from "./routes/_app.tsx";
import { RootRoute } from "./routes/_root.tsx";
import { HomeRoute } from "./routes/home.tsx";
import { tryRoutes } from "./routes/try.tsx";
import { LoginGoogleRedirectRoute, WelcomeRoute } from "./routes/welcome.tsx";
import { env } from "./utils/env.ts";

const routes: RouteObject[] = [
  AppRoute({
    children: [
      RootRoute,
      WelcomeRoute,
      LoginGoogleRedirectRoute,
      HomeRoute,
      {
        path: "/DELETEME",
        element: <code>DELETEME</code>,
      },
    ],
  }),
  ...(env.DEV ? tryRoutes : []), // Only use try routes in dev
];

/** https://reactrouter.com/en/main/start/tutorial#adding-a-router */
const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
