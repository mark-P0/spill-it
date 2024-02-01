import clsx from "clsx";
import { ComponentProps, useEffect } from "react";
import { ToastProvider } from "../contexts/toast";
import { removeBodyClasses, restoreBodyClasses } from "../utils/body-classes";
import { Toast } from "./Toast";

export function Screen(props: ComponentProps<"div">) {
  useEffect(() => {
    return () => {
      restoreBodyClasses(); // Unmounting the screen means the body will be seen, in which case the animations should be shown
    };
  }, []);

  const { children, className, ...attributes } = props;
  return (
    <ToastProvider>
      <div
        {...attributes}
        className={clsx("min-h-screen", "bg-fuchsia-950 text-white", className)}
        onTransitionEnd={removeBodyClasses} // Animations still "computed" even if screen is in front
      >
        {children}
      </div>

      <Toast />
    </ToastProvider>
  );
}
