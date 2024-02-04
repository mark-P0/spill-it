import { ReactNode, useCallback, useState } from "react";
import { createNewContext } from "../../../utils/react";

export const [useModalContext, ModalProvider] = createNewContext(() => {
  const [content, setContent] = useState<ReactNode>(null); // Used for rendering
  const showOnModal = useCallback(
    (content: ReactNode) => setContent(content),
    [],
  );

  const [isOpen, setIsOpen] = useState(false); // Used for animations
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const [isCancellable, setIsCancellable] = useState(true);
  const makeModalCancellable = useCallback(
    (condition: boolean) => setIsCancellable(condition),
    [],
  );

  return {
    ...{ content, showOnModal },
    ...{ isOpen, openModal, closeModal },
    ...{ isCancellable, makeModalCancellable },
  };
});
