import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-container": "#4d8eff",
        "surface": "#131314",
        "secondary-container": "#00a572",
        "background": "#0a0a0a",
        "surface-container-high": "#2a2a2b",
        "primary": "#adc6ff",
        "secondary": "#4edea3",
      },
      fontFamily: {
        "h3": ["Inter", "sans-serif"],
        "label-caps": ["Space Grotesk", "sans-serif"],
        "body-main": ["Inter", "sans-serif"],
        "data-mono": ["Space Grotesk", "monospace"]
      }
    },
  },
  plugins: [],
};
