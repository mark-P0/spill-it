import { AnimatePalettePlugin } from "./src/assets/tailwind/animate-palette.plugin";
import { AnimateToastPlugin } from "./src/assets/tailwind/animate-toast.plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [AnimateToastPlugin, AnimatePalettePlugin],
};
