import React from "react";
import ReactDOM from "react-dom/client";
import {
  LoaderFunction,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  redirect,
} from "react-router-dom";
import { ErrorScreen, RootRoute } from "./App.tsx";
import "./assets/tailwind.css";
import {
  LoginGoogleRedirectRoute,
  WelcomeRoute,
} from "./routes/WelcomeRoute.tsx";
import { HomeScreen, loadHome } from "./routes/home";
import { endpoint } from "./utils/endpoints.ts";

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

/** https://reactrouter.com/en/main/utils/create-routes-from-elements */
const routes = createRoutesFromElements(
  <Route errorElement={<ErrorScreen />}>
    {RootRoute()}
    {WelcomeRoute()}
    {LoginGoogleRedirectRoute()}
    <Route
      path={endpoint("/home")}
      loader={loadHome}
      element={<HomeScreen />}
    />
    <Route path="/query" element={null} loader={loadSearchParamsFromUrl} />
    <Route path="/sleep" element={null} loader={loadSleep} />
    <Route path="/error" element={null} loader={loadError} />
  </Route>,
);

/** https://reactrouter.com/en/main/start/tutorial#adding-a-router */
const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
