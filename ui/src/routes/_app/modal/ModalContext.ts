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

  /**
   * Must pass function state in another function, otherwise it will be considered as an "updater function"
   *
   * e.g.
   * ```ts
   * setOnDismiss(() => () => {
   *   // Callback logic here
   * })
   *
   * setonDismiss(function updater() {
   *   return function callback() {
   *     // Callback logic here
   *   }
   * })
   * ```
   *
   * - https://medium.com/swlh/how-to-store-a-function-with-the-usestate-hook-in-react-8a88dd4eede1
   * - https://react.dev/reference/react/useState#setstate-parameters
   */
  const [onDismiss, setOnDismiss] = useState<(() => void) | null>(null);

  return {
    ...{ content, showOnModal },
    ...{ isOpen, openModal, closeModal },
    ...{ isCancellable, makeModalCancellable },
    ...{ onDismiss, setOnDismiss },
  };
});
