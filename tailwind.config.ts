import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#0F172A",
        accent: "#10B981",
      },
    },
  },
  plugins: [],
};

export default config;
