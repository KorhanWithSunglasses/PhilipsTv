/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#FF6600",
        "tv-black": "#050505",
      },
      fontFamily: {
        display: ["var(--font-spline-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
