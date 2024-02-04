import { LoaderFunction, RouteObject, redirect } from "react-router-dom";
import { Screen } from "./_app/Screen";
import { ModalContent } from "./_app/modal/Modal";
import { useModalContext } from "./_app/modal/ModalContext";

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
  { path: "/query", element: null, loader: loadSearchParamsFromUrl },
  { path: "/sleep", element: null, loader: loadSleep },
  { path: "/error", element: null, loader: loadError },
  modalRoute,
];
