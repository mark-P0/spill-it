import { RouteObject, redirect } from "react-router-dom";
import { logger } from "../utils/logger";
import { Screen } from "./_app/Screen";
import { ModalContent } from "./_app/modal/Modal";
import { useModalContext } from "./_app/modal/ModalContext";

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

const queryRoute: RouteObject = (() => {
  return {
    path: "/query",
    async loader(arg) {
      const { params, request } = arg;
      const query = Object.fromEntries(new URL(request.url).searchParams);

      logger.debug({ arg, params, request });
      logger.debug(query);

      return null;
    },
    element: null,
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

const toastRoute: RouteObject = (() => {
  return {
    path: "/toast",
    element: <Screen></Screen>,
  };
})();

const modalRoute: RouteObject = (() => {
  function ScreenModalContent() {
    const { isCancellable, makeModalCancellable } = useModalContext();

    return (
      <ModalContent>
        <button onClick={() => makeModalCancellable(!isCancellable)}>
          {JSON.stringify({ isCancellable })}
        </button>
      </ModalContent>
    );
  }

  function ScreenContent() {
    const { showOnModal } = useModalContext();

    function showModal() {
      showOnModal(<ScreenModalContent />);
    }
    return (
      <div>
        modal should open...
        <button onClick={showModal}>Open modal</button>
      </div>
    );
  }

  return {
    path: "/modal",
    element: (
      <Screen>
        <ScreenContent />
      </Screen>
    ),
  };
})();

export const tryRoutes: RouteObject[] = [
  queryRoute,
  sleepRoute,
  loadRoute,
  toastRoute,
  modalRoute,
];
