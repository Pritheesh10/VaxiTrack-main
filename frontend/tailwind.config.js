/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}"
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: "#f5f3ff",
					100: "#ede9fe",
					200: "#ddd6fe",
					300: "#c4b5fd",
					400: "#a78bfa",
					500: "#8b5cf6",
					600: "#7c3aed",
					700: "#6d28d9",
					800: "#5b21b6",
					900: "#4c1d95",
				},
				secondary: {
					DEFAULT: "#22D3EE",
					light: "#67E8F9",
				},
				dark: "#0D0D1A",
				surface: "#13132A",
			},
			borderRadius: {
				xl: "12px",
				"2xl": "16px",
				"3xl": "20px",
			},
			boxShadow: {
				card: "0 8px 32px rgba(0,0,0,0.3)",
				"card-hover": "0 8px 32px rgba(124,58,237,0.15)",
				glow: "0 0 20px rgba(124,58,237,0.4)",
				"glow-success": "0 4px 14px rgba(16,185,129,0.4)",
				"glow-danger": "0 4px 14px rgba(239,68,68,0.3)",
				"glow-purple": "0 0 30px rgba(124,58,237,0.3)",
				header: "0 1px 3px rgba(0,0,0,0.2)",
				modal: "0 25px 50px rgba(0,0,0,0.5)",
			},
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
			},
		}
	},
	plugins: []
};
