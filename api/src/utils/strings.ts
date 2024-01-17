export const lettersLowercase = Array.from({ length: 26 }, (_, idx) =>
  String.fromCharCode("a".charCodeAt(0) + idx)
);
export const lettersUppercase = Array.from({ length: 26 }, (_, idx) =>
  String.fromCharCode("A".charCodeAt(0) + idx)
);
export const letters = [...lettersLowercase, ...lettersUppercase];

export function splitAtFirstInstance(
  str: string,
  sep: string
): [string, string] {
  const sepIdx = str.indexOf(sep);
  if (sepIdx === -1) {
    return [str, ""];
  }

  return [str.slice(0, sepIdx), str.slice(sepIdx + 1)];
}
