/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // placeholder brand palette — refined during Phase 5 polish
        brand: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
        },
      },
    },
  },
  plugins: [],
}
