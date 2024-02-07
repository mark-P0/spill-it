import { useCallback, useState } from "react";
import { createNewContext } from "../../../utils/react";

type ToastContent = string | null;
type ToastLevel = "info" | "warn";

export const [useToastContext, ToastProvider] = createNewContext(() => {
  const [content, setContent] = useState<ToastContent>(null);
  const [level, setLevel] = useState<ToastLevel>("info");

  const showOnToast = useCallback(
    (content: ToastContent, level: ToastLevel = "info") => {
      setContent(content);
      setLevel(level);
    },
    [],
  );

  return { content, level, showOnToast };
});
