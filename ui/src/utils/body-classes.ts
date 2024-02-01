import { raise } from "@spill-it/utils/errors";

const bodyClasses =
  document.body.getAttribute("class") ?? raise("Document body has no classes!");
export function restoreBodyClasses() {
  document.body.setAttribute("class", bodyClasses);
}
export function removeBodyClasses() {
  document.body.removeAttribute("class");
}
