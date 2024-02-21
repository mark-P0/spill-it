import { ensureError, raise } from "@spill-it/utils/errors";
import { sleep } from "@spill-it/utils/sleep";
import clsx from "clsx";
import {
  ChangeEvent,
  ComponentProps,
  useEffect,
  useRef,
  useState,
} from "react";
import { BsXLg } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { LoadingCursorAbsoluteOverlay } from "../_app/Loading";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";
import { Toast } from "../_app/toast/Toast";
import { ToastProvider, useToastContext } from "../_app/toast/ToastContext";
import { useProfileContext } from "./ProfileContext";

// TODO Allow providing refs?
/** Allow specifying custom validity(ies) as props */
function Input(
  props: Omit<ComponentProps<"input">, "ref"> & {
    validity?: string;
    reportValidity?: boolean;
  },
) {
  const { validity, reportValidity, ...attributes } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (input === null) return;

    input.setCustomValidity(validity ?? "");
    if (reportValidity) input.reportValidity();
  }, [validity, reportValidity]);

  return <input {...attributes} ref={inputRef} />;
}

function EditProfileForm() {
  const navigate = useNavigate();
  const { profile } = useProfileContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { showOnToast } = useToastContext();

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
      logger.debug("Retrieving session info...");
      const headerAuth = getFromStorage("SESS");

      logger.debug("Requesting update...");
      let username: string | undefined;
      if (newUsername !== profile.username && newUsername !== "") {
        username = newUsername;
      }
      let handleName: string | undefined;
      if (newHandleName !== profile.handleName && newHandleName !== "") {
        handleName = newHandleName;
      }
      const result = await fetchAPI("/api/v0/users/me", "PATCH", {
        headers: { Authorization: headerAuth },
        body: { details: { username, handleName } },
      });
      if (!result.success) raise("Failed updating profile info", result.error);

      logger.debug("Redirecting to [new] username...");
      showOnToast(<>Success! ✨ Redirecting...</>, "info");
      await sleep(1); // Give time for user to digest toast // TODO Is this time enough?
      navigate(endpointWithParam("/:username", { username: newUsername }));
      return; // Operations after the try-catch block should not matter as the app will redirect anyway
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
    }
    setIsProcessing(false);
    makeModalCancellable(true);
  }

  if (profile === null) return null;

  const isFormUnedited =
    newUsername === profile.username && newHandleName === profile.handleName;
  const isFormEmpty = newUsername === "" && newHandleName === "";
  const canSave =
    !isProcessing && // Should be redundant
    !isFormUnedited &&
    !isFormEmpty;

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
            <Input
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
            <Input
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
            disabled={!canSave}
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
      {
        // TODO Create local toast for ALL modals? i.e. in the Modal component
        /** Localize toast in modal content so that it maybe shown on [top] of the "top layer" */
      }
      <ToastProvider>
        <EditProfileForm />

        <Toast />
      </ToastProvider>
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
