import clsx from "clsx";
import { PropsWithChildren } from "react";
import { ToastProvider, useToastContext } from "../contexts/toast";
import { randomKey } from "../utils/react";

export function Toast() {
  const { toastAttrs, setToastAttrs } = useToastContext();

  if (toastAttrs === null) return null;
  const { content, level } = toastAttrs;

  return (
    <dialog
      key={randomKey()} // Ensure "new" toast every time content is changed
      open
      onAnimationEnd={() => setToastAttrs(null)} // Remove from DOM when finished
      className={clsx(
        "absolute bottom-[5%]",
        "rounded px-4 py-2",
        "font-bold text-sm tracking-wider",
        level === "info" && "bg-fuchsia-500 text-white",
        level === "warn" && "bg-yellow-500",
        "animate-toast",
      )}
    >
      {content}
    </dialog>
  );
}

export function ToastProviderWithComponent(props: PropsWithChildren) {
  const { children } = props;

  return (
    <ToastProvider>
      {children}
      <Toast />
    </ToastProvider>
  );
}
