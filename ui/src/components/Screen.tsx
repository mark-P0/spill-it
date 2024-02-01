import clsx from "clsx";
import { ComponentProps, useEffect, useState } from "react";
import { ToastProvider } from "../contexts/toast";
import { removeBodyClasses, restoreBodyClasses } from "../utils/body-classes";
import { Toast } from "./Toast";

export function Screen(props: ComponentProps<"div">) {
  const [isRendered, setIsRendered] = useState(false);
  useEffect(() => {
    setIsRendered(true);

    return () => {
      restoreBodyClasses(); // Unmounting the screen means the body will be seen, in which case the animations should be shown
    };
  }, []);

  const { children, className, ...attributes } = props;
  return (
    <ToastProvider>
      <div className="overflow-clip">
        <div
          {...attributes}
          className={clsx(
            "min-h-screen",
            "bg-fuchsia-950 text-white",
            ...[
              "transition duration-700",
              !isRendered && "opacity-0 scale-105",
            ],
            className,
          )}
          onTransitionEnd={removeBodyClasses} // Animations still "computed" even if screen is in front
        >
          {children}
        </div>
      </div>

      <Toast />
    </ToastProvider>
  );
}
