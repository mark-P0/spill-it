import clsx from "clsx";
import { ComponentProps, useEffect, useState } from "react";
import { ToastProvider } from "../../contexts/ToastContext";
import {
  removeBodyClasses,
  restoreBodyClasses,
} from "../../utils/body-classes";
import { Toast } from "./toast/Toast";

export function Screen(props: ComponentProps<"div">) {
  const [isRendered, setIsRendered] = useState(false);
  useEffect(() => {
    setIsRendered(true);
  }, []);

  const [hasTransitioned, setHasTransitioned] = useState(false);
  useEffect(() => {
    if (hasTransitioned) removeBodyClasses(); // Animations still "computed" even if screen is in front
    return () => {
      restoreBodyClasses(); // Unmounting the screen means the body will be seen, in which case the animations should be shown
    };
  }, [hasTransitioned]);

  const { children, className, ...attributes } = props;
  return (
    <ToastProvider>
      {/** "Container" for hiding overflow of actual screen  */}
      <div className="overflow-clip">
        {/** Actual screen */}
        <div
          {...attributes}
          onTransitionEnd={() => setHasTransitioned(true)}
          className={clsx(
            "min-h-screen",
            "bg-fuchsia-950 text-white",
            ...[
              "transition duration-700",
              !isRendered && "opacity-0 scale-105",
            ],
            className,
          )}
        >
          {children}
        </div>
      </div>

      <Toast />
    </ToastProvider>
  );
}
