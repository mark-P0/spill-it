import plugin from "tailwindcss/plugin";

export const AnimatePalettePlugin = plugin(undefined, {
  theme: {
    extend: {
      keyframes: {
        /**
         * https://github.com/tailwindlabs/tailwindcss/discussions/2049
         * - Using `@apply` in plugins
         */
        palette: {
          "from, to": {
            "@apply bg-fuchsia-500": {},
          },
          "33%": {
            "@apply bg-rose-500": {},
          },
          "66%": {
            "@apply bg-yellow-500": {},
          },
        },
      },
      animation: {
        palette: "palette 8s ease-in-out infinite",
      },
    },
  },
});
