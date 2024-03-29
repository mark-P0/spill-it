import TailwindScrollbar from "tailwind-scrollbar";
import { AnimatePalettePlugin } from "./src/assets/tailwind/animate-palette.plugin";
import { AnimateToastPlugin } from "./src/assets/tailwind/animate-toast.plugin";
import { FontQuicksandPlugin } from "./src/assets/tailwind/font-quicksand/font-quicksand.plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    TailwindScrollbar,
    FontQuicksandPlugin,
    ...[AnimateToastPlugin, AnimatePalettePlugin],
  ],
};
