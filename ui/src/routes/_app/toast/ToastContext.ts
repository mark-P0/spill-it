import { useState } from "react";
import { createNewContext } from "../../../utils/react";

type ToastAttrs = {
  content: string;
  level: "info" | "warn";
};

export const [useToastContext, ToastProvider] = createNewContext(() => {
  const [toastAttrs, setToastAttrs] = useState<ToastAttrs | null>(null);

  return { toastAttrs, setToastAttrs };
});