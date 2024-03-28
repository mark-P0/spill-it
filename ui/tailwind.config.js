import TailwindScrollbar from "tailwind-scrollbar";
import { AnimatePalettePlugin } from "./src/assets/tailwind/animate-palette.plugin";
import { AnimateToastPlugin } from "./src/assets/tailwind/animate-toast.plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [TailwindScrollbar, ...[AnimateToastPlugin, AnimatePalettePlugin]],
};
