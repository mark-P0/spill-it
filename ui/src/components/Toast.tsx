import clsx from "clsx";
import { PropsWithChildren } from "react";
import { ToastProvider, useToastContext } from "../contexts/toast";

// TODO Move to dedicated React utils?
let key = 0;
function randomKey() {
  return key++;
}

export function Toast() {
  const { toastAttrs, setToastAttrs } = useToastContext();
  if (toastAttrs === null) return null;

  const { content, level } = toastAttrs;
  return (
    <dialog
      key={randomKey()} // Ensure "new" toast every time content is changed
      open
      className={clsx(
        "absolute bottom-[5%]",
        "rounded px-4 py-2",
        "font-bold text-sm tracking-wider",
        level === "info" && "bg-fuchsia-500 text-white",
        level === "warn" && "bg-yellow-500",
        "animate-toast",
      )}
      onAnimationEnd={() => setToastAttrs(null)} // Remove from DOM when finished
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
