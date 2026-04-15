/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                /* ── Brand ── */
                "primary":        "#258cf4",
                "primary-hover":  "#1d76d3",

                /* ── Light Mode (Snow White) ── */
                "background-light": "#f8fafc",
                "surface-light":    "#ffffff",
                "neutral-tint":     "#eef4fb",

                /* ── Dark Mode (Deep Purple) ── */
                "background-dark":  "#0d0d1a",
                "surface-dark":     "#13132a",
                "neutral-dark":     "#1a1a35",

                /* ── Purple accent palette ── */
                "purple": {
                    50:  "#f5f3ff",
                    100: "#ede9fe",
                    200: "#ddd6fe",
                    300: "#c4b5fd",
                    400: "#a78bfa",
                    500: "#8b5cf6",
                    600: "#7c3aed",
                    700: "#6d28d9",
                    800: "#5b21b6",
                    900: "#4c1d95",
                    950: "#2e1065",
                },
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg":      "0.5rem",
                "xl":      "0.75rem",
                "2xl":     "1rem",
                "full":    "9999px",
            },
            transitionDuration: {
                "400": "400ms",
            },
            keyframes: {
                /* Theme toggle knob slide */
                "knob-to-dark": {
                    "0%":   { transform: "translateX(0px)" },
                    "100%": { transform: "translateX(28px)" },
                },
                "knob-to-light": {
                    "0%":   { transform: "translateX(28px)" },
                    "100%": { transform: "translateX(0px)" },
                },
                /* Ripple on toggle */
                "theme-ripple": {
                    "0%":   { transform: "scale(0)", opacity: "0.6" },
                    "100%": { transform: "scale(4)", opacity: "0" },
                },
                /* Slide-in toast */
                "slideInRight": {
                    "0%":   { transform: "translateX(120%)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
            },
            animation: {
                "knob-dark":    "knob-to-dark 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
                "knob-light":   "knob-to-light 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
                "theme-ripple": "theme-ripple 0.6s ease-out forwards",
                "slideInRight": "slideInRight 0.3s ease forwards",
            },
        },
    },
    plugins: [],
}

