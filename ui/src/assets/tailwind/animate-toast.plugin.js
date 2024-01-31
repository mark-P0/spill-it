import plugin from "tailwindcss/plugin";

export const AnimateToastPlugin = plugin(undefined, {
  theme: {
    keyframes: {
      toast: {
        from: {
          opacity: "0%",
          transform: "translateY(100%)",
        },
        "10%": {
          opacity: "100%",
          transform: "translateY(0%)",
        },
        "90%": {
          opacity: "100%",
          transform: "translateY(0%)",
        },
        to: {
          opacity: "0%",
          transform: "translateY(100%)",
        },
      },
    },
    animation: {
      toast: "toast 4s ease-in-out both",
    },
  },
});
