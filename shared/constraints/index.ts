import { digits, letters } from "@spill-it/utils/strings";
import { z } from "zod";

export const POSTS_CT_MAX_API = 16;
export const POSTS_CT_MAX_UI = 8;

export const usernameCharset = new Set([...letters, ...digits]);
function isUsernameCharsValid(username: string): boolean {
  return username.split("").every((char) => usernameCharset.has(char));
}

export const USERNAME_LEN_MIN = 6;
export const USERNAME_LEN_MAX = 18;
export const zodUsername = z
  .string()
  .min(USERNAME_LEN_MIN)
  .max(USERNAME_LEN_MAX)
  .refine(isUsernameCharsValid, "Invalid username characters")
  .optional();

export const HANDLE_LEN_MIN = 1;
export const HANDLE_LEN_MAX = 24;
export const zodHandle = z
  .string()
  .min(HANDLE_LEN_MIN)
  .max(HANDLE_LEN_MAX)
  .optional();

export const BIO_LEN_MIN = 0;
export const BIO_LEN_MAX = 128;
export const zodBio = z.string().min(BIO_LEN_MIN).max(BIO_LEN_MAX).optional();
