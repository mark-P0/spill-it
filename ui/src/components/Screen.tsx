import clsx from "clsx";
import { ComponentProps } from "react";

export function Screen(props: ComponentProps<"div">) {
  const { children, className, ...attributes } = props;

  return (
    <div
      {...attributes}
      className={clsx("min-h-screen", "bg-fuchsia-950 text-white", className)}
    >
      {children}
    </div>
  );
}
