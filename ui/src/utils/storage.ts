import { raise } from "@spill-it/utils/errors";
import { safe } from "@spill-it/utils/safe";
import { z } from "zod";
import { fetchAPI } from "./fetch-api";
import { logger } from "./logger";

// TODO Find better alternative to local storage...
const storageMap = {
  SESS: z.string(),
};
type StorageMap = typeof storageMap;
type Key = keyof StorageMap;
type Value<T extends Key> = z.infer<StorageMap[T]>;

export function setOnStorage<T extends Key>(key: T, value: Value<T>) {
  const encoded = btoa(value);
  localStorage.setItem(key, encoded);
}

export function getFromStorage<T extends Key>(key: T): Value<T> {
  const encoded =
    localStorage.getItem(key) ?? raise("Key does not exist on storage");
  const rawValue = atob(encoded);

  const valueParsing = storageMap[key].safeParse(rawValue);
  const value = valueParsing.success
    ? valueParsing.data
    : raise("Unexpected value from storage");

  return value;
}

export function deleteFromStorage(key: Key) {
  // TODO Do something if key does not exist?
  localStorage.removeItem(key);
}

export async function isLoggedIn(): Promise<boolean> {
  const headerAuthResult = safe(() => getFromStorage("SESS"));
  if (!headerAuthResult.success) {
    logger.warn("No session stored; assuming not logged in...");
    return false;
  }
  const headerAuth = headerAuthResult.value;

  const result = await fetchAPI("/api/v0/users/me", "GET", {
    headers: {
      Authorization: headerAuth,
    },
  });
  if (!result.success) {
    logger.warn("Failed fetching user info; assuming not logged in...");
    return false;
  }

  return true;
}
