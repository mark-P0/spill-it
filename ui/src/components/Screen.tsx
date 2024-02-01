import clsx from "clsx";
import { ComponentProps, PropsWithChildren, useEffect, useState } from "react";
import { ToastProvider } from "../contexts/toast";
import { removeBodyClasses, restoreBodyClasses } from "../utils/body-classes";
import { Toast } from "./Toast";

export function Screen(props: PropsWithChildren<ComponentProps<"div">>) {
  const [isRendered, setIsRendered] = useState(false);
  useEffect(() => {
    setIsRendered(true);

    return () => {
      restoreBodyClasses(); // Restore background animations to be visible in e.g. route changes
    };
  }, []);

  const { children, className, ...attributes } = props;
  return (
    <div
      {...attributes}
      className={clsx(
        "relative",
        "min-h-screen",
        "bg-fuchsia-950 text-white",
        ...["transition duration-1000", !isRendered && "opacity-0"],
        className,
      )}
      onTransitionEnd={removeBodyClasses} // Remove background animations that still takes up performance
    >
      <ToastProvider>
        {children}
        <Toast />
      </ToastProvider>
    </div>
  );
}
