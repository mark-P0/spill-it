import clsx from "clsx";
import { PropsWithChildren, useEffect } from "react";
import { ToastProvider, useToastContext } from "../contexts/toast";

export function Toast() {
  const { toastAttrs, setToastAttrs } = useToastContext();

  // TODO Do on animation end?
  useEffect(() => {
    const id = setTimeout(() => {
      setToastAttrs(null);
    }, 3000);

    return () => {
      clearTimeout(id);
    };
  });

  if (toastAttrs === null) return null;
  const { content, level } = toastAttrs;

  return (
    <dialog
      open
      className={clsx(
        "absolute bottom-[5%]",
        "rounded px-4 py-2",
        "font-bold text-sm tracking-wider",
        level === "info" && "bg-fuchsia-500 text-white",
        level === "warn" && "bg-yellow-500",
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
