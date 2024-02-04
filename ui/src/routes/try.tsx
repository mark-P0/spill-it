import { RouteObject, redirect } from "react-router-dom";

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

const queryRoute: RouteObject = (() => {
  return {
    path: "/query",
    element: null,
    async loader(arg) {
      const { params, request } = arg;
      const query = Object.fromEntries(new URL(request.url).searchParams);

      console.log({ arg, params, request });
      console.log(query);

      return redirect("/");
    },
  };
})();

const sleepRoute = (() => {
  return {
    path: "/sleep",
    element: null,
    async loader() {
      await sleep(3);
      return redirect("/");
    },
  };
})();

const loadRoute = (() => {
  return {
    path: "/error",
    element: null,
    loader() {
      throw new Error("bruh");
    },
  };
})();

export const tryRoutes: RouteObject[] = [queryRoute, sleepRoute, loadRoute];
