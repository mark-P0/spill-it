import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./assets/tailwind.css";
import { appRoute } from "./routes.tsx";
import { tryRoutes } from "./routes/try.tsx";
import { env } from "./utils/env.ts";

/** https://reactrouter.com/en/main/start/tutorial#adding-a-router */
const router = createBrowserRouter([
  appRoute,
  ...(env.DEV ? tryRoutes : []), // Only use try routes in dev
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
