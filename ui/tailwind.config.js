import { AnimateToastPlugin } from "./src/assets/tailwind/animate-toast.plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [AnimateToastPlugin],
};
