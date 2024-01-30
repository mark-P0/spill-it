/**
 * `json-complete` might be relatively better but will be unreadable...
 */

import { parse, stringify } from "superjson";

export function jsonPack(jsObject: unknown): string {
  return stringify(jsObject);
}

export function jsonUnpack(packed: string): unknown {
  return parse(packed);
}
