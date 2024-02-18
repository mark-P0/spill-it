export const lettersLowercase = Array.from({ length: 26 }, (_, idx) =>
  String.fromCharCode("a".charCodeAt(0) + idx),
);
export const lettersUppercase = Array.from({ length: 26 }, (_, idx) =>
  String.fromCharCode("A".charCodeAt(0) + idx),
);
export const letters = [...lettersLowercase, ...lettersUppercase];

export const digits = Array.from({ length: 10 }, (_, idx) =>
  String.fromCharCode("0".charCodeAt(0) + idx),
);
