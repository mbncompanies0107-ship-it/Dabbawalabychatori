import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F3EEE6",
        paper: "#FFFCF8",
        ink: "#1C1917",
        brand: {
          50: "#E7F5EF",
          100: "#C6E6D8",
          200: "#8FCBB4",
          400: "#1F8A62",
          500: "#127A55",
          600: "#0E6246",
          700: "#0C4E38",
          800: "#0B3D2E",
          900: "#08261D",
        },
        spice: {
          400: "#F08A4B",
          500: "#E15A2A",
          600: "#C4471C",
        },
        gold: "#B8893D",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 16px 40px -28px rgba(28, 25, 23, 0.45)",
        lift: "0 18px 50px -24px rgba(11, 61, 46, 0.35)",
      },
      maxWidth: {
        page: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
