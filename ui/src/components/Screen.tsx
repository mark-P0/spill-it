import clsx from "clsx";
import { ComponentProps } from "react";
import { ToastProvider } from "../contexts/toast";
import { Toast } from "./Toast";

export function Screen(props: ComponentProps<"div">) {
  const { children, className, ...attributes } = props;

  return (
    <ToastProvider>
      <div
        {...attributes}
        className={clsx("min-h-screen", "bg-fuchsia-950 text-white", className)}
      >
        {children}
      </div>

      <Toast />
    </ToastProvider>
  );
}
