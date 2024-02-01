import { AnimateToastPlugin } from "./src/assets/tailwind/animate-toast.plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.tsx"],
  theme: {
    extend: {},
  },
  plugins: [AnimateToastPlugin],
};
