/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        cairo: ["Cairo", "sans-serif"],
      },
      colors: {
        navy: "#0f172a",
        orange: "#f97316",
      },
      animation: {
        bounce: "bounce 2s infinite",
      },
      boxShadow: {
        glow: "0 0 30px rgba(249, 115, 22, 0.6)",
        "glow-lg": "0 0 40px rgba(249, 115, 22, 0.8)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
