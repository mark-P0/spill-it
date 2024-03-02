import clsx from "clsx";
import { ComponentPropsWithoutRef, useEffect, useState } from "react";
import { removeBodyClasses, restoreBodyClasses } from "../../utils/dom";

export function Screen(props: ComponentPropsWithoutRef<"div">) {
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
    <div
      // "Container" for hiding overflow of actual screen
      className="overflow-clip"
    >
      {/** Actual screen */}
      <div
        {...attributes}
        onTransitionEnd={() => setHasTransitioned(true)}
        className={clsx(
          "min-h-screen",
          "bg-fuchsia-950 text-white",
          ...["transition duration-700", !isRendered && "opacity-0 scale-105"],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
