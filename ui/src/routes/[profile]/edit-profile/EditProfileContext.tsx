import { User } from "@spill-it/db/schema/drizzle";
import { ensureError, raise } from "@spill-it/utils/errors";
import { sleep } from "@spill-it/utils/sleep";
import { digits, letters } from "@spill-it/utils/strings";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { z } from "zod";
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

const BIO_LEN_MIN = 0;
const BIO_LEN_MAX = 128;
const zodBio = z.string().min(BIO_LEN_MIN).max(BIO_LEN_MAX).optional();

async function requestUpdate(
  username: string | undefined,
  handleName: string | undefined,
  bio: string | undefined,
) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/users/me", "PATCH", {
    headers: { Authorization: headerAuth },
    body: { details: { username, handleName, bio } },
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
          return parsing.error.issues[0]?.message ?? "Invalid username";
        }

        return "";
      }, []),
    );
    useEffect(() => {
      if (user === null) return;
      updateNewUsername(user.username);
    }, [user, updateNewUsername]);

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
    useEffect(() => {
      if (user === null) return;
      updateNewBio(user.bio);
    }, [user, updateNewBio]);

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
        let bio: string | undefined;
        if (newBio !== user.bio && newBio !== "") {
          bio = newBio;
        }

        logger.debug("Sending update request...");
        await requestUpdate(username, handleName, bio);

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
      newBio === user?.bio;
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
      ...{ newHandleName, newHandleNameValidity, updateNewHandleName },
      ...{ newUsername, newUsernameValidity, updateNewUsername },
      ...{ newBio, newBioValidity, updateNewBio },
      ...{ isProcessing, save },
      canSave,
    };
  },
);
