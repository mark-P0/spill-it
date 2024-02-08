import { createHmac, createSecretKey, generateKeySync } from "crypto";

/**
 * https://security.stackexchange.com/questions/95972/what-are-requirements-for-hmac-secret-key
 * - A cryptographic key of 128-bits or greater cannot be brute forced in the current lifetime
 * - This is especially true for symmetric algorithms like HMAC
 * - Strictly speaking however, the key should be as long as the output length of the hashing algorithm used
 * - For example, SHA256 produces 256 bits, and therefore ideally should be given a 256-bit key as well
 *
 * Can generate key with `openssl rand -hex 16`
 * - `openssl rand` generates random bytes (16 bytes in the above)
 * - A byte has 8 bits, so 16 bytes is equivalent to 16*8 = 128 bits
 * - The bytes can be encoded in either base-64 or hexadecimal (as in above)
 * - A byte can produce 2 characters in hexadecimal form, from `00` to `FF`
 * - 16 bytes encoded in hexadecimal results in a 32-character string
 *
 * Alternatively Node's `crypto` module also provides functions for creating a key
 * - `length` options refers to the number of **bits** (not bytes!)
 */
export function createHMACKeyObject(bitLength: number = 128) {
  return generateKeySync("hmac", { length: bitLength });
}
export function createHMACKey(bitLength: number = 128) {
  return createHMACKeyObject(bitLength).export().toString("hex");
}

/**
 * Create a signature for the given `value` using a secret key
 * - https://stackoverflow.com/a/7480211
 * - https://stackoverflow.com/a/72765383
 */
export function sign(key: string, value: string): string {
  /**
   * Node prefers passing in keys as a `KeyObject` instead of regular strings
   * - https://nodejs.org/api/crypto.html#class-keyobject
   * - https://nodejs.org/api/crypto.html#cryptocreatehmacalgorithm-key-options
   * - https://stackoverflow.com/questions/74228565/what-are-differences-between-createsign-and-privateencrypt-in-nodecryp
   */
  const keyObj = createSecretKey(key, "hex");

  return createHmac("SHA256", keyObj).update(value).digest("hex");
}

/**
 * Check if the signature that came with a value is valid
 *
 * Basically sign the value again and check if it matches the incoming signature
 */
export function isSignatureValid(
  key: string,
  value: string,
  signature: string,
): boolean {
  const actualSignature = sign(key, value);
  return signature === actualSignature;
}
