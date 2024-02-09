/**
 * Used mainly to stop effects on unmounts,
 * kind of like `AbortController` for fetches.
 */
export type Controller = {
  shouldProceed: boolean;
};
