/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void:   "#080808",
        ink:    "#0f0f0f",
        panel:  "#141414",
        edge:   "#1c1c1c",
        cinema: {
          red:    "#E50914",
          crimson:"#b81d24",
          dark:   "#7a0a0f",
          gold:   "#f5c518",
          silver: "#a8a8a8",
        },
      },
      fontFamily: {
        display: ["'Oswald'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "glow-red":    "0 0 24px rgba(229,9,20,0.45)",
        "glow-crimson":"0 0 24px rgba(184,29,36,0.4)",
        "glow-gold":   "0 0 20px rgba(245,197,24,0.4)",
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease forwards",
        "fade-in":   "fadeIn 0.4s ease forwards",
        "scale-in":  "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "shimmer":   "shimmer 1.8s linear infinite",
        "float":     "float 4s ease-in-out infinite",
        "scan":      "scan 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:   { from:{opacity:0,transform:"translateY(24px)"}, to:{opacity:1,transform:"translateY(0)"} },
        fadeIn:   { from:{opacity:0}, to:{opacity:1} },
        scaleIn:  { from:{opacity:0,transform:"scale(0.85)"}, to:{opacity:1,transform:"scale(1)"} },
        shimmer:  { "0%":{backgroundPosition:"-200% 0"}, "100%":{backgroundPosition:"200% 0"} },
        float:    { "0%,100%":{transform:"translateY(0px)"}, "50%":{transform:"translateY(-8px)"} },
        scan:     { "0%,100%":{opacity:0.3}, "50%":{opacity:1} },
      },
    },
  },
  plugins: [],
};
