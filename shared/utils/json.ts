/**
 * `json-complete` might be relatively better but will be unreadable...
 * - https://old.reddit.com/r/javascript/comments/j6xneb/superjson_json_on_steroids/
 * - https://github.com/cierelabs/json-complete
 */

import { parse, stringify } from "superjson";

export function jsonPack(jsObject: unknown): string {
  return stringify(jsObject);
}

export function jsonUnpack(packed: string): unknown {
  return parse(packed);
}
