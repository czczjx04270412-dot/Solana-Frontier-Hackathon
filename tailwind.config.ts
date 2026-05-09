import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        panel: "#101827",
        line: "#243247",
        aqua: "#2dd4bf",
        lime: "#84cc16",
        amber: "#f59e0b",
        danger: "#fb7185"
      },
      boxShadow: {
        glow: "0 16px 50px rgba(15, 23, 42, 0.32)"
      }
    }
  },
  plugins: []
};

export default config;
