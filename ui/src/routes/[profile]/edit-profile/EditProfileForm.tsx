import { User } from "@spill-it/db/schema/drizzle";
import { ensureError, raise } from "@spill-it/utils/errors";
import { sleep } from "@spill-it/utils/sleep";
import { digits, letters } from "@spill-it/utils/strings";
import clsx from "clsx";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { BsXLg } from "react-icons/bs";
import { z } from "zod";
import { redirectFull } from "../../../utils/dom";
import { endpointWithParam } from "../../../utils/endpoints";
import { fetchAPI } from "../../../utils/fetch-api";
import { logger } from "../../../utils/logger";
import { createNewContext } from "../../../utils/react";
import { getFromStorage } from "../../../utils/storage";
import { Input } from "../../_app/Input";
import { LoadingCursorAbsoluteOverlay } from "../../_app/Loading";
import { useUserContext } from "../../_app/UserContext";
import { clsBtn, clsBtnIcon } from "../../_app/classes";
import { useModalContext } from "../../_app/modal/ModalContext";
import { useToastContext } from "../../_app/toast/ToastContext";

/** `validator` must be wrapped in a `useCallback()` hook */
function useFieldState<T, U>(defaultValue: T, validator: (newValue: T) => U) {
  const [value, setValue] = useState(defaultValue);
  const [validity, setValidity] = useState(validator(defaultValue));

  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      setValidity(validator(newValue));
    },
    [validator],
  );

  return [value, validity, updateValue] as const;
}

// TODO Reuse these from DB package?
const charset = new Set([...letters, ...digits]);
function isUsernameCharsValid(username: User["username"]): boolean {
  return username.split("").every((char) => charset.has(char));
}

const HANDLE_LEN_MIN = 1;
const HANDLE_LEN_MAX = 24;
const zodHandle = z.string().min(HANDLE_LEN_MIN).max(HANDLE_LEN_MAX).optional();

const USERNAME_LEN_MIN = 6;
const USERNAME_LEN_MAX = 18;
const zodUsername = z
  .string()
  .min(USERNAME_LEN_MIN)
  .max(USERNAME_LEN_MAX)
  .refine(isUsernameCharsValid, "Invalid username characters")
  .optional();

async function requestUpdate(
  username: string | undefined,
  handleName: string | undefined,
) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/users/me", "PATCH", {
    headers: { Authorization: headerAuth },
    body: { details: { username, handleName } },
  });
  if (!result.success) raise("Failed updating profile info", result.error);
}
const [useEditProfileContext, EditProfileProvider] = createNewContext(() => {
  const { user } = useUserContext();
  const { makeModalCancellable } = useModalContext();
  const { showOnToast } = useToastContext();

  const newHandleNameDefault: string = "";
  const [newHandleName, newHandleNameValidity, updateNewHandleName] =
    useFieldState(
      newHandleNameDefault,
      useCallback((incoming) => {
        const parsing = zodHandle.safeParse(incoming);
        if (!parsing.success) {
          return parsing.error.issues[0]?.message ?? "Invalid handle name";
        }

        return "";
      }, []),
    );
  useEffect(() => {
    if (user === null) return;
    updateNewHandleName(user.handleName);
  }, [user, updateNewHandleName]);

  const newUsernameDefault: string = "";
  const [newUsername, newUsernameValidity, updateNewUsername] = useFieldState(
    newUsernameDefault,
    useCallback((incoming) => {
      const parsing = zodUsername.safeParse(incoming);
      if (!parsing.success) {
        return parsing.error.issues[0]?.message ?? "Invalid handle name";
      }

      return "";
    }, []),
  );
  useEffect(() => {
    if (user === null) return;
    updateNewUsername(user.username);
  }, [user, updateNewUsername]);

  const [isProcessing, setIsProcessing] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (user === null) {
      logger.warn("User not available? Ignoring update...");
      return;
    }

    setIsProcessing(true);
    makeModalCancellable(false);
    try {
      let username: string | undefined;
      if (newUsername !== user.username && newUsername !== "") {
        username = newUsername;
      }
      let handleName: string | undefined;
      if (newHandleName !== user.handleName && newHandleName !== "") {
        handleName = newHandleName;
      }

      logger.debug("Sending update request...");
      await requestUpdate(username, handleName);

      logger.debug("Redirecting to [new] username...");
      showOnToast(<>Success! ✨ Redirecting...</>, "info");
      await sleep(1); // Give time for user to digest toast // TODO Is this time enough?
      redirectFull(endpointWithParam("/:username", { username: newUsername }));

      return; // Operations after the try-catch block should not matter as the app will redirect anyway
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
    }
    setIsProcessing(false);
    makeModalCancellable(true);
  }

  // TODO Set these as constraints?
  const isFormUnedited =
    newUsername === user?.username && newHandleName === user?.handleName;
  const isFormEmpty = newUsername === "" && newHandleName === "";
  const areConstraintsSatisfied =
    newUsernameValidity === "" && newHandleNameValidity === "";
  const canSave =
    !isProcessing && // Should be redundant
    !isFormUnedited &&
    !isFormEmpty && // Possibly redundant with constraints
    areConstraintsSatisfied;

  return {
    ...{ newHandleName, newHandleNameValidity, updateNewHandleName },
    ...{ newUsername, newUsernameValidity, updateNewUsername },
    ...{ isProcessing, save },
    canSave,
  };
});

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
