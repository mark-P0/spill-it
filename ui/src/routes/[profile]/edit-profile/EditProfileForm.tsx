import clsx from "clsx";
import { ChangeEvent } from "react";
import { BsXLg } from "react-icons/bs";
import { Input } from "../../_app/Input";
import { LoadingCursorAbsoluteOverlay } from "../../_app/Loading";
import { clsBtn, clsBtnIcon } from "../../_app/classes";
import { useModalContext } from "../../_app/modal/ModalContext";
import {
  EditProfileProvider,
  useEditProfileContext,
} from "./EditProfileContext";

function HandleNameField() {
  const { newHandleName, newHandleNameValidity, updateNewHandleName } =
    useEditProfileContext();

  function reflect(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    updateNewHandleName(input.value);
  }

  return (
    <label className="select-none grid gap-1 group/handle">
      <span
        className={clsx(
          "text-xs uppercase tracking-wide",
          ...[
            "transition",
            "text-white/50 group-focus-within/handle:text-white group-has-[:invalid]/handle:text-red-500",
          ],
        )}
      >
        Handle Name
      </span>
      <Input
        type="text"
        name="handleName"
        value={newHandleName}
        onChange={reflect}
        validity={newHandleNameValidity}
        reportValidity
        className={clsx(
          "bg-transparent",
          "border rounded px-2 py-1",
          ...[
            "transition",
            "disabled:opacity-50",
            "border-white/25 group-focus-within/handle:border-white group-has-[:invalid]/handle:border-red-500",
          ],
        )}
      />
    </label>
  );
}
function UsernameField() {
  const { newUsername, newUsernameValidity, updateNewUsername } =
    useEditProfileContext();

  function reflect(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    updateNewUsername(input.value);
  }

  return (
    <label className="select-none grid gap-1 group/username">
      <span
        className={clsx(
          "text-xs uppercase tracking-wide",
          ...[
            "transition",
            "text-white/50 group-focus-within/username:text-white group-has-[:invalid]/username:text-red-500",
          ],
        )}
      >
        Username
      </span>
      <Input
        type="text"
        name="username"
        value={newUsername}
        onChange={reflect}
        validity={newUsernameValidity}
        reportValidity
        className={clsx(
          "bg-transparent",
          "border rounded px-2 py-1",
          ...[
            "transition",
            "disabled:opacity-50",
            "border-white/25 group-focus-within/username:border-white group-has-[:invalid]/username:border-red-500",
          ],
        )}
      />
    </label>
  );
}

function _EditProfileForm() {
  const { closeModal } = useModalContext();
  const attributes = useEditProfileContext();
  const { isProcessing, save } = attributes;
  const { canSave } = attributes;

  return (
    <form onSubmit={save} className="relative">
      <fieldset disabled={isProcessing} className="grid gap-6">
        <header className="flex items-center gap-6">
          <h2 className="text-3xl font-bold">Edit Profile</h2>

          <div className="ml-auto">
            <button
              type="button"
              onClick={closeModal}
              className={clsx(clsBtnIcon)}
            >
              <BsXLg />
            </button>
          </div>
        </header>

        <div className="grid gap-3">
          <HandleNameField />
          <UsernameField />
        </div>

        <footer className="flex flex-row-reverse">
          <button disabled={!canSave} className={clsx(clsBtn)}>
            Save
          </button>
        </footer>
      </fieldset>

      {isProcessing && <LoadingCursorAbsoluteOverlay />}
    </form>
  );
}
export function EditProfileForm() {
  return (
    <EditProfileProvider>
      <_EditProfileForm />
    </EditProfileProvider>
  );
}
