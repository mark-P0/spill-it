import { LoaderFunction, RouteObject, redirect } from "react-router-dom";

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

export const tryRoutes: RouteObject[] = [
  { path: "/query", element: null, loader: loadSearchParamsFromUrl },
  { path: "/sleep", element: null, loader: loadSleep },
  { path: "/error", element: null, loader: loadError },
];
