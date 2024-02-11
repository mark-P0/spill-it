import { z } from "zod";

/**
 * https://github.com/colinhacks/zod/issues/372#issuecomment-826380330
 * - Double function required as TS only allows either inferred or explicit generics, but not a mix
 */
export function zodOfType<T>() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Only used for typechecking, and the author has "guaranteed" functionality
  return <S extends z.ZodType<T, any, any>>(schema: S) => schema;
}
