/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // BodhGanga Academy - Heritage Brand Colors (from logo.jpeg)
                emerald: {
                    DEFAULT: '#0F5132',
                    light: '#1A7F4F',
                    dark: '#0A3D25',
                    50: '#E8F5EE',
                    100: '#D1EBE0',
                    200: '#A3D7C1',
                    300: '#75C3A2',
                    400: '#47AF83',
                    500: '#0F5132',
                    600: '#0C4128',
                    700: '#09311E',
                    800: '#062014',
                    900: '#03100A',
                },
                gold: {
                    DEFAULT: '#C9A961',
                    light: '#D9BD7F',
                    dark: '#B89543',
                    50: '#FAF7F0',
                    100: '#F5EFE1',
                    200: '#EBDFC3',
                    300: '#E1CFA5',
                    400: '#D7BF87',
                    500: '#C9A961',
                    600: '#B89543',
                    700: '#8A7032',
                    800: '#5C4A21',
                    900: '#2E2511',
                },
                ivory: {
                    DEFAULT: '#F8F6F0',
                    light: '#FDFCF9',
                    dark: '#F0EDE3',
                },
                saffron: {
                    DEFAULT: '#D4915A',
                    light: '#E0A876',
                    dark: '#C07A3E',
                },

            },
            fontFamily: {
                serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
                sans: ['Inter', 'Lato', 'system-ui', 'sans-serif'],
                display: ['Cinzel', 'serif'],
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-in-out",
                "slide-up": "slideUp 0.3s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideDown: {
                    "0%": { opacity: "0", transform: "translateY(-10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
}
