import clsx from "clsx";
import { ChangeEvent } from "react";
import { BsXLg } from "react-icons/bs";
import { Input, TextArea } from "../../_app/Input";
import { LoadingCursorAbsoluteOverlay } from "../../_app/Loading";
import { clsBreakAnywhere, clsBtn, clsBtnIcon } from "../../_app/classes";
import { useModalContext } from "../../_app/modal/ModalContext";
import {
  EditProfileProvider,
  useEditProfileContext,
} from "./EditProfileContext";

function HandleNameField() {
  const attributes = useEditProfileContext();
  const { newHandleName, newHandleNameValidity, updateNewHandleName } =
    attributes;
  const { areFieldsInitialized } = attributes;

  function reflect(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    updateNewHandleName(input.value);
  }

  return (
    <label className="select-none grid gap-1 group/field">
      <span
        className={clsx(
          "text-xs uppercase tracking-wide",
          ...[
            "transition",
            "text-white/50 group-focus-within/field:text-white group-has-[:invalid]/field:text-red-500",
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
        reportValidity={areFieldsInitialized}
        className={clsx(
          "bg-transparent",
          "border rounded-lg px-2 py-1",
          ...[
            "transition",
            "disabled:opacity-50",
            "border-white/25 group-focus-within/field:border-white group-has-[:invalid]/field:border-red-500",
          ],
        )}
      />
    </label>
  );
}

function UsernameField() {
  const attributes = useEditProfileContext();
  const { newUsername, newUsernameValidity, updateNewUsername } = attributes;
  const { areFieldsInitialized } = attributes;

  function reflect(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    updateNewUsername(input.value);
  }

  return (
    <label className="select-none grid gap-1 group/field">
      <span
        className={clsx(
          "text-xs uppercase tracking-wide",
          ...[
            "transition",
            "text-white/50 group-focus-within/field:text-white group-has-[:invalid]/field:text-red-500",
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
        reportValidity={areFieldsInitialized}
        className={clsx(
          "bg-transparent",
          "border rounded-lg px-2 py-1",
          ...[
            "transition",
            "disabled:opacity-50",
            "border-white/25 group-focus-within/field:border-white group-has-[:invalid]/field:border-red-500",
          ],
        )}
      />
    </label>
  );
}

function BioField() {
  const attributes = useEditProfileContext();
  const { newBio, newBioValidity, updateNewBio } = attributes;
  const { areFieldsInitialized } = attributes;

  function reflect(event: ChangeEvent<HTMLTextAreaElement>) {
    const input = event.target;
    updateNewBio(input.value);
  }

  return (
    <label className="select-none grid gap-1 group/field">
      <span
        className={clsx(
          "text-xs uppercase tracking-wide",
          ...[
            "transition",
            "text-white/50 group-focus-within/field:text-white group-has-[:invalid]/field:text-red-500",
          ],
        )}
      >
        Bio
      </span>
      <TextArea
        name="bio"
        value={newBio}
        onChange={reflect}
        validity={newBioValidity}
        reportValidity={areFieldsInitialized}
        className={clsx(
          "resize-none",
          clsBreakAnywhere,
          "bg-transparent",
          "border rounded-lg px-2 py-1",
          ...[
            "transition",
            "disabled:opacity-50",
            "border-white/25 group-focus-within/field:border-white group-has-[:invalid]/field:border-red-500",
          ],
        )}
      />
    </label>
  );
}

function IsPrivateField() {
  const { isPrivate, setIsPrivate } = useEditProfileContext();

  function reflect(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    setIsPrivate(input.checked);
  }

  return (
    <label className="select-none flex gap-2">
      <input
        type="checkbox"
        name="isPrivate"
        checked={isPrivate}
        onChange={reflect}
      />
      Private
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
          <BioField />
          <IsPrivateField />
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
