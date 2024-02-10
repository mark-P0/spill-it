import { ReactNode, useCallback, useState } from "react";
import { createNewContext } from "../../../utils/react";

type ToastLevel = "info" | "warn";

export const [useToastContext, ToastProvider] = createNewContext(() => {
  const [content, setContent] = useState<ReactNode>(null);
  const [level, setLevel] = useState<ToastLevel>("info");

  const showOnToast = useCallback(
    (content: ReactNode, level: ToastLevel = "info") => {
      setContent(content);
      setLevel(level);
    },
    [],
  );

  return { content, level, showOnToast };
});
