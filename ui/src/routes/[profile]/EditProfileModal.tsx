import clsx from "clsx";
import { useEffect } from "react";
import { BsXLg } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";

function EditProfileForm() {
  const { closeModal } = useModalContext();

  return (
    <form>
      <fieldset className="grid gap-6">
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
              className={clsx(
                "bg-transparent",
                "border border-white/25 rounded px-2 py-1",
              )}
            />
          </label>
        </div>

        <footer className="flex flex-row-reverse">
          <button
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
