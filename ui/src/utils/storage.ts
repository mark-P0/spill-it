import { raise } from "@spill-it/utils/errors";
import { z } from "zod";

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
