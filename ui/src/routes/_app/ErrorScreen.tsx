import clsx from "clsx";
import { useRouteError } from "react-router-dom";

export function ErrorScreen() {
  const error = useRouteError();
  console.error(error);

  return (
    <main
      className={clsx(
        "h-screen w-screen",
        "grid place-items-center",
        "bg-stone-700 text-white",
      )}
    >
      Sorry! We spilt too much. Please try again!
    </main>
  );
}
