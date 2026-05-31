/** @type {import('tailwindcss').Config} */
export default {
  content: [  
    "./index.html",  
    "./src/**/*.{js,ts,jsx,tsx}",  
  ],
  theme: {
    extend: {
      colors: {
        primary: "#004AAD", // Primary color
        secondary: "#FFCA28", // Secondary color
        background: "#F7F7F7", // Background color
        textBgLight: "#ADD5FF", // Light background for text
        textBgSoft: "#FFEBC1", // Soft background for text
      },
      fontFamily: {
        primary: ["Inter", "Be Vietnam Pro", "system-ui", "sans-serif"],
        secondary: ["Be Vietnam Pro", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
