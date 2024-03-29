import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

export const FontQuicksandPlugin = plugin(undefined, {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Quicksand"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
});
