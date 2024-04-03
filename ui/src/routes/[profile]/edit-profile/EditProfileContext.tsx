import { zodBio, zodHandle, zodUsername } from "@spill-it/constraints";
import { ensureError, raise } from "@spill-it/utils/errors";
import { sleep } from "@spill-it/utils/sleep";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { redirectFull } from "../../../utils/dom";
import { endpointWithParam } from "../../../utils/endpoints";
import { fetchAPI } from "../../../utils/fetch-api";
import { logger } from "../../../utils/logger";
import { createNewContext } from "../../../utils/react";
import { getFromStorage } from "../../../utils/storage";
import { useUserContext } from "../../_app/UserContext";
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

async function sendUpdate(
  username: string | undefined,
  handleName: string | undefined,
  bio: string | undefined,
  isPrivate: boolean,
) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/users/me", "PATCH", {
    headers: { Authorization: headerAuth },
    body: { details: { username, handleName, bio, isPrivate } },
  });
  if (!result.success) raise("Failed updating profile info", result.error);
}

export const [useEditProfileContext, EditProfileProvider] = createNewContext(
  () => {
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
    const newUsernameDefault: string = "";
    const [newUsername, newUsernameValidity, updateNewUsername] = useFieldState(
      newUsernameDefault,
      useCallback((incoming) => {
        const parsing = zodUsername.safeParse(incoming);
        if (!parsing.success) {
          return parsing.error.issues[0]?.message ?? "Invalid username";
        }

        return "";
      }, []),
    );
    const newBioDefault: string = "";
    const [newBio, newBioValidity, updateNewBio] = useFieldState(
      newBioDefault,
      useCallback((incoming) => {
        const parsing = zodBio.safeParse(incoming);
        if (!parsing.success) {
          return parsing.error.issues[0]?.message ?? "Invalid bio";
        }

        return "";
      }, []),
    );
    const [isPrivate, setIsPrivate] = useState(false);

    const [areFieldsInitialized, setAreFieldsInitialized] = useState(false);
    useEffect(() => {
      if (user === null) return;
      updateNewHandleName(user.handleName);
      updateNewUsername(user.username);
      updateNewBio(user.bio);
      setIsPrivate(user.isPrivate);

      setAreFieldsInitialized(true);
    }, [user, updateNewHandleName, updateNewUsername, updateNewBio]);

    const [isProcessing, setIsProcessing] = useState(false);
    async function save(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (user === null) {
        logger.warn("User not available? Ignoring update...");
        return;
      }

      if (user?.username === "guest") {
        logger.error("Guests cannot edit profiles");
        showOnToast(<>Ready to spill? 😋</>, "info");
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
        let bio: string | undefined;
        if (newBio !== user.bio) {
          bio = newBio;
        }

        logger.debug("Sending update request...");
        await sendUpdate(username, handleName, bio, isPrivate);

        logger.debug("Redirecting to [new] username...");
        showOnToast(<>Success! ✨ Redirecting...</>, "info");
        await sleep(1); // Give time for user to digest toast // TODO Is this time enough?
        redirectFull(
          endpointWithParam("/:username", { username: newUsername }),
        );

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
      newUsername === user?.username &&
      newHandleName === user?.handleName &&
      newBio === user?.bio &&
      isPrivate === user?.isPrivate;
    const isFormEmpty =
      newUsername === "" && newHandleName === "" && newBio === "";
    const areConstraintsSatisfied =
      newUsernameValidity === "" &&
      newHandleNameValidity === "" &&
      newBioValidity === "";
    const canSave =
      !isProcessing && // Should be redundant
      !isFormUnedited &&
      !isFormEmpty && // Possibly redundant with constraints
      areConstraintsSatisfied;

    return {
      ...{ isPrivate, setIsPrivate },
      ...{ newHandleName, newHandleNameValidity, updateNewHandleName },
      ...{ newUsername, newUsernameValidity, updateNewUsername },
      ...{ newBio, newBioValidity, updateNewBio },
      areFieldsInitialized,
      ...{ isProcessing, save },
      canSave,
    };
  },
);
