import { raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import {
  ComponentPropsWithoutRef,
  SyntheticEvent,
  TransitionEvent,
  useEffect,
  useRef,
} from "react";
import { Toast } from "../toast/Toast";
import { ToastProvider } from "../toast/ToastContext";
import { useModalContext } from "./ModalContext";

/**
 * **CAN** be used as basis for modal content,
 * but is [currently] not a strict requirement.
 */
export function ModalContent(props: ComponentPropsWithoutRef<"article">) {
  const { children, className, ...attributes } = props;

  return (
    <ToastProvider>
      <article
        {...attributes}
        className={clsx(
          "rounded-lg p-6",
          "bg-fuchsia-950 text-white",
          className,
        )}
      >
        {children}
      </article>

      <Toast />
    </ToastProvider>
  );
}

export function Modal() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const attributes = useModalContext();
  const { content, showOnModal } = attributes;
  const { isOpen, openModal, closeModal } = attributes;
  const { isCancellable } = attributes;
  const { onDismiss, setOnDismiss } = attributes;

  /** Open dialog as modal on render */
  useEffect(() => {
    if (content === null) return; // Dialog is present only run if there is content

    const dialog =
      dialogRef.current ?? raise("Referenced dialog does not exist...?");
    dialog.showModal();
    openModal();
  }, [content, openModal]);

  function cancel(event: SyntheticEvent) {
    /**
     * When the cancel event is triggered, e.g. on `Esc` press,
     * the browser closes the dialog rather ungracefully.
     * This prevents that behavior, in an attempt to ease things out.
     */
    event.preventDefault();
    if (!isCancellable) return; // Do not close dialog if not cancellable

    closeModal();
  }

  let hasEnded = false;
  function handleTransitionEnd(event: TransitionEvent) {
    if (hasEnded) return; // Prevent "re-runs" of the transition handler...

    if (content === null) return; // Nothing to discard

    const dialog =
      dialogRef.current ?? raise("Referenced dialog does not exist...?");
    if (event.target !== dialog) return; // Only run on dialog transitions

    if (isOpen) return; // Only run when dialog has been "closed"

    runDismissCallback();
    discardContent();

    hasEnded = true;
  }
  function runDismissCallback() {
    if (onDismiss === null) return;
    onDismiss();
    setOnDismiss(null);
  }
  function discardContent() {
    showOnModal(null);
  }

  if (content === null) return null;
  return (
    <dialog
      ref={dialogRef}
      onCancel={cancel}
      onTransitionEnd={handleTransitionEnd}
      className={clsx(
        "bg-transparent backdrop:bg-black/50",
        ...[
          "transition backdrop:transition",
          "duration-500 backdrop:duration-500",
          !isOpen && "scale-95 opacity-0 backdrop:opacity-0",
        ],
      )}
    >
      {content}
    </dialog>
  );
}
