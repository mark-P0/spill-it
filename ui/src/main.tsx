import React from "react";
import ReactDOM from "react-dom/client";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { App } from "./App.tsx";
import "./assets/tailwind.css";

/** https://reactrouter.com/en/main/utils/create-routes-from-elements */
const routes = createRoutesFromElements(
  <>
    <Route path="/" element={<App />} />
    <Route path="/hello" element={<div>I'm a new route!</div>} />
  </>,
);

/** https://reactrouter.com/en/main/start/tutorial#adding-a-router */
const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
