import { ReactNode, useCallback, useState } from "react";
import { createNewContext } from "../../../utils/react";

export const [useModalContext, ModalProvider] = createNewContext(() => {
  const [content, setContent] = useState<ReactNode>(null); // Used for rendering
  const [isOpen, setIsOpen] = useState(false); // Used for animations

  function showOnModal(content: ReactNode) {
    setContent(content);
  }

  // const openModal = useCallback(() => setIsOpen(true), []);
  // const closeModal = useCallback(() => setIsOpen(false), []);

  function openModal() {
    setIsOpen(true);
  }
  function closeModal() {
    setIsOpen(false);
  }

  return {
    ...{ content, showOnModal },
    ...{ isOpen, openModal, closeModal },
  };
});
