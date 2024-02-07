import { useCallback, useState } from "react";
import { createNewContext } from "../../../utils/react";

type ToastAttrs = {
  content: string;
  level: "info" | "warn";
};

type ToastContent = string | null;
type ToastLevel = "info" | "warn";

export const [useToastContext, ToastProvider] = createNewContext(() => {
  const [toastAttrs, setToastAttrs] = useState<ToastAttrs | null>(null);

  const [content, setContent] = useState<ToastContent>(null);
  const [level, setLevel] = useState<ToastLevel>("info");

  const showOnToast = useCallback(
    (content: ToastContent, level: ToastLevel = "info") => {
      setContent(content);
      setLevel(level);
    },
    [],
  );

  return { toastAttrs, setToastAttrs, content, level, showOnToast };
});
