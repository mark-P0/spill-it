import React from "react";
import ReactDOM from "react-dom/client";
import {
  LoaderFunction,
  RouteObject,
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";
import "./assets/tailwind.css";
import { AppRoute } from "./routes/_app.tsx";
import { RootRoute } from "./routes/_root.tsx";
import { HomeRoute } from "./routes/home.tsx";
import { LoginGoogleRedirectRoute, WelcomeRoute } from "./routes/welcome.tsx";

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

const loadSearchParamsFromUrl: LoaderFunction = async (arg) => {
  const { params, request } = arg;
  const query = Object.fromEntries(new URL(request.url).searchParams);

  console.log({ arg, params, request });
  console.log(query);

  return redirect("/");
};
const loadSleep: LoaderFunction = async () => {
  await sleep(3);
  return redirect("/");
};
const loadError: LoaderFunction = () => {
  throw new Error("bruh");
};

const routes: RouteObject[] = [
  AppRoute({
    children: [RootRoute, WelcomeRoute, LoginGoogleRedirectRoute, HomeRoute],
  }),
  { path: "/query", element: null, loader: loadSearchParamsFromUrl },
  { path: "/sleep", element: null, loader: loadSleep },
  { path: "/error", element: null, loader: loadError },
];

/** https://reactrouter.com/en/main/start/tutorial#adding-a-router */
const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
