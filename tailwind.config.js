/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'orange-bg': '#FFF8F0',
                'orange-text': '#8B4513',
                'orange-line': '#FFB347',
                'green-bg': '#F0FFF4',
                'green-text': '#006400',
                'green-line': '#90EE90',
                'pink-bg': '#FFF0F5',
                'pink-text': '#8B008B',
                'pink-line': '#FF69B4',
                'cyan-bg': '#F0FFFF',
                'cyan-text': '#008B8B',
                'cyan-line': '#00CED1',
                'blue-bg': '#F0F8FF',
                'blue-text': '#00008B',
                'blue-line': '#87CEFA',
            }
        },
    },
    plugins: [],
}
