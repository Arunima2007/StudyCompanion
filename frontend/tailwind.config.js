/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#6C5CE7",
        "brand-soft": "#f0eeff",
        "brand-mid": "#ddd9ff",
        ink: "#1a1a2e",
        muted: "#6b6b8a"
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"]
      },
      boxShadow: {
        card: "0 24px 60px rgba(108, 92, 231, 0.12)"
      }
    }
  },
  plugins: []
};
