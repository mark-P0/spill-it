const classes =
  document.body.getAttribute("class") ??
  (() => {
    console.warn("No document body classes...?");
    return "";
  })();

export function removeBodyClasses() {
  document.body.removeAttribute("class");
}
export function restoreBodyClasses() {
  document.body.setAttribute("class", classes);
}
