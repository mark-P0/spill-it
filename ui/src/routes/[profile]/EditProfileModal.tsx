import { ensureError, raise } from "@spill-it/utils/errors";
import { randomChoice } from "@spill-it/utils/random";
import { sleep } from "@spill-it/utils/sleep";
import clsx from "clsx";
import { ChangeEvent, useEffect, useState } from "react";
import { BsXLg } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { logger } from "../../utils/logger";
import { LoadingCursorAbsoluteOverlay } from "../_app/Loading";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";
import { useProfileContext } from "./ProfileContext";

function EditProfileForm() {
  const navigate = useNavigate();
  const { profile } = useProfileContext();
  const { closeModal, makeModalCancellable } = useModalContext();

  const [newHandleName, setNewHandleName] = useState("");
  useEffect(() => {
    if (profile === null) return;
    setNewHandleName(profile.handleName);
  }, [profile]);
  function reflectNewHandleName(event: ChangeEvent<HTMLInputElement>) {
    setNewHandleName(event.target.value);
  }

  const [newUsername, setNewUsername] = useState("");
  useEffect(() => {
    if (profile === null) return;
    setNewUsername(profile.username);
  }, [profile]);
  function reflectNewUsername(event: ChangeEvent<HTMLInputElement>) {
    setNewUsername(event.target.value);
  }

  const [isProcessing, setIsProcessing] = useState(false);
  async function save() {
    if (profile === null) {
      logger.warn("Profile not available; ignoring update...");
      return;
    }

    setIsProcessing(true);
    makeModalCancellable(false);
    try {
      // DELETEME
      {
        await sleep(3);
        randomChoice([
          () => console.warn("save success"),
          () => raise("save failed"),
        ])();
      }

      navigate(endpointWithParam("/:username", { username: newUsername }));
      return; // Operations after the try-catch block should not matter as the app will redirect anyway
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
    }
    setIsProcessing(false);
    makeModalCancellable(true);
  }

  if (profile === null) return null;

  return (
    <form className="relative">
      <fieldset disabled={isProcessing} className="grid gap-6">
        <header className="flex items-center gap-6">
          <h2 className="text-3xl font-bold">Edit Profile</h2>

          <div className="ml-auto">
            <button
              type="button"
              onClick={closeModal}
              className={clsx(
                "w-9 aspect-square",
                "rounded-full p-2",
                ...[
                  "transition",
                  "disabled:opacity-50",
                  "enabled:active:scale-90",
                  "enabled:hover:bg-white/25",
                ],
              )}
            >
              <BsXLg className="w-full h-full" />
            </button>
          </div>
        </header>

        <div className="grid gap-3">
          <label className="select-none grid gap-1 group/handle">
            <span
              className={clsx(
                "text-xs uppercase tracking-wide",
                ...[
                  "transition",
                  "text-white/50 group-focus-within/handle:text-white",
                ],
              )}
            >
              Handle Name
            </span>
            <input
              type="text"
              name="handleName"
              value={newHandleName}
              onChange={reflectNewHandleName}
              className={clsx(
                "bg-transparent",
                "border border-white/25 rounded px-2 py-1",
              )}
            />
          </label>

          <label className="select-none grid gap-1 group/username">
            <span
              className={clsx(
                "text-xs uppercase tracking-wide",
                ...[
                  "transition",
                  "text-white/50 group-focus-within/username:text-white",
                ],
              )}
            >
              Username
            </span>
            <input
              type="text"
              name="username"
              value={newUsername}
              onChange={reflectNewUsername}
              className={clsx(
                "bg-transparent",
                "border border-white/25 rounded px-2 py-1",
              )}
            />
          </label>
        </div>

        <footer className="flex flex-row-reverse">
          <button
            type="button"
            onClick={save}
            className={clsx(
              "select-none",
              "rounded-full px-6 py-3",
              "font-bold tracking-wide",
              ...[
                "transition",
                "disabled:opacity-50",
                "enabled:active:scale-95",
                "bg-fuchsia-500 enabled:hover:bg-fuchsia-600",
              ],
            )}
          >
            Save
          </button>
        </footer>
      </fieldset>

      {isProcessing && <LoadingCursorAbsoluteOverlay />}
    </form>
  );
}
function EditProfileModalContent() {
  return (
    <ModalContent>
      <EditProfileForm />
    </ModalContent>
  );
}
function _EditProfileModal() {
  const navigate = useNavigate();
  const { showOnModal, setOnDismiss } = useModalContext();
  useEffect(() => {
    showOnModal(<EditProfileModalContent />);
    setOnDismiss(() => () => {
      navigate("..");
    });
  }, [showOnModal, setOnDismiss, navigate]);

  return null;
}
export function EditProfileModal() {
  return (
    <ModalProvider>
      <_EditProfileModal />

      <Modal />
    </ModalProvider>
  );
}
