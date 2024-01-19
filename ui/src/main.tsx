import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";
import "./assets/tailwind.css";

/** https://reactrouter.com/en/main/start/tutorial#adding-a-router */
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/hello",
    element: <div>I'm a new route!</div>,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
