import clsx from "clsx";
import { useEffect, useRef } from "react";
import { RouteObject, redirect } from "react-router-dom";
import { Screen } from "./_app/Screen";
import { ModalContent } from "./_app/modal/Modal";
import { useModalContext } from "./_app/modal/ModalContext";

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

type Tag = keyof HTMLElementTagNameMap; // From signature of `document.createElement()`
type AttributeValue = string | boolean;
type Child = string | Node; // From signature of `Element.replaceChildren()`

function E<T extends Tag>(
  tag: T,
  attributes: Record<string, AttributeValue>,
  children: Child[],
): HTMLElementTagNameMap[T] {
  const element = document.createElement(tag);
  return EE(element, attributes, children);
}
function EE<T extends HTMLElement>(
  element: T,
  attributes: Record<string, AttributeValue>,
  children: Child[],
): T {
  for (const [name, givenValue] of Object.entries(attributes)) {
    let value = givenValue;

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute
     * - Boolean attributes set to `true` should be set to an empty string
     * - Boolean attributes set to `false` should NOT be present in the element at all
     */
    if (typeof value === "boolean") {
      if (!value) continue;
      value = "";
    }

    element.setAttribute(name, value);
  }

  element.replaceChildren(...children);

  return element;
}

const googleLoginButtonRoute: RouteObject = (() => {
  function Element() {
    const divRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const div = divRef.current;
      if (div == null) return;

      EE(div, {}, [
        E(
          "script",
          { src: "https://accounts.google.com/gsi/client", async: true },
          [],
        ),
      ]);
    }, []);

    return (
      <Screen>
        <div
          className="flex" // Used to contain the sign-in button as it seems to resize on its own...
        >
          <div className="relative overflow-clip w-min h-min">
            {
              /**
               * Ideally this script element from Google should be used.
               * However React does not seem to "render" script elements,
               * so it is added via regular DOM manipulation into the `<div>` container that follows.
               *
               * The location of the script element does not seem to matter,
               * however it seems to work only if the elements are actually
               * already in the DOM. This can be tricky because of e.g. React rerenders.
               */
              // <script src="https://accounts.google.com/gsi/client" async></script>

              <div ref={divRef}></div>
            }

            {
              /**
               * Can configure the button visually using Google's tool
               *
               * https://developers.google.com/identity/gsi/web/tools/configurator
               */
              <>
                <div
                  id="g_id_onload"
                  data-client_id="1087789624520-nkoblr8n59th42s76gqrok4useaq2ojj.apps.googleusercontent.com"
                  // data-login_uri="https://your.domain/your_login_endpoint"
                  data-auto_prompt="false"
                ></div>
                <div
                  className="g_id_signin"
                  data-type="standard"
                  data-size="large"
                  data-theme="outline"
                  data-text="continue_with"
                  data-shape="rectangular"
                  data-logo_alignment="left"
                ></div>
              </>
            }

            {/** The following is laid on top of the Google sign-in button to "override" its behavior. */}
            <button
              onClick={() => console.warn("Actually login!")}
              className={clsx(
                "absolute top-0 left-0 w-full h-full",
                // "bg-blue-500/50",
                "bg-transparent",
              )}
            >
              {/* I should be invisible */}
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  return {
    path: "/google",
    element: <Element />,
  };
})();

export const tryRoutes: RouteObject[] = [
  queryRoute,
  sleepRoute,
  loadRoute,
  toastRoute,
  modalRoute,
  googleLoginButtonRoute,
];
