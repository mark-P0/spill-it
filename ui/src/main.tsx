import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./assets/tailwind.css";
import { AppRoute } from "./routes/_app.tsx";
import { RootRoute } from "./routes/_root.tsx";
import { HomeRoute } from "./routes/home.tsx";
import { LogoutRoute } from "./routes/logout.tsx";
import { tryRoutes } from "./routes/try.tsx";
import { LoginGoogleRedirectRoute, WelcomeRoute } from "./routes/welcome.tsx";
import { env } from "./utils/env.ts";

/** https://reactrouter.com/en/main/start/tutorial#adding-a-router */
const router = createBrowserRouter([
  AppRoute({
    children: [
      RootRoute,
      WelcomeRoute,
      LoginGoogleRedirectRoute,
      LogoutRoute,
      HomeRoute,
    ],
  }),
  ...(env.DEV ? tryRoutes : []), // Only use try routes in dev
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
