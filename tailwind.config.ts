import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0A2E1F",
        "pitch-2": "#0F3D2A",
        "pitch-line": "#1C5238",
        lime: "#3BE37A",
        gold: "#F4C430",
        chalk: "#F2F5EE",
        slatey: "#83A292",
        danger: "#FF6B6B",
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
