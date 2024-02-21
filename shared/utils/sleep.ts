/** https://stackoverflow.com/a/39914235 */
export async function sleep(seconds: number) {
  // @ts-ignore - TS complains that `setTimeout` is not defined (but it should be)... The "proper" solution is likely adding the `'dom'` lib in `tsconfig.json` and/or installing `@types/node`...
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
