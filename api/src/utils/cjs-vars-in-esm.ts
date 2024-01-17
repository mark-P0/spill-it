/**
 * https://nodejs.org/api/esm.html#no-__filename-or-__dirname
 *
 * Latest Node versions now have the `import.meta.filename` and `import.meta.dirname` values
 * but until they are "stable", building them from scratch would be safest.
 */

import path from "node:path";
import url from "node:url";

/** https://nodejs.org/api/esm.html#importmetafilename */
export function getFilename(importMetaUrl: string) {
  return url.fileURLToPath(importMetaUrl);
}

/** https://nodejs.org/api/esm.html#importmetadirname */
export function getDirname(importMetaUrl: string) {
  return path.dirname(getFilename(importMetaUrl));
}

/** Assumes Node was invoked at the "project root"! */
export function getFilenameRelativeToRoot(importMetaUrl: string) {
  // return getFilename(importMetaUrl).replace(process.cwd(), "");

  const root = url.pathToFileURL(process.cwd()).href;
  return importMetaUrl.replace(root, "");
}
