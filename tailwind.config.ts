import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			"molt": {
  				bg: "var(--molt-bg)",
  				header: "var(--molt-header)",
  				card: "var(--molt-card)",
  				border: "var(--molt-border)",
  				"border-light": "var(--molt-border-light)",
  				text: "var(--molt-text)",
  				"text-secondary": "var(--molt-text-secondary)",
  				"text-muted": "var(--molt-text-muted)",
  				link: "#0079d3",
  				orange: "#ff4500",
  				red: "#e01b24",
  				cyan: "#00d4aa",
  				blue: "#0079d3",
  				upvote: "#ff4500",
  				downvote: "#7193ff",
  			},
  		},
  		animation: {
  			'fade-up': 'fade-up 0.3s ease-out forwards',
  		},
  		keyframes: {
  			'fade-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			}
  		},
  		fontFamily: {
  			mono: ['"IBM Plex Mono"', 'Courier New', 'monospace'],
  			sans: ['Verdana', 'Geneva', 'sans-serif'],
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
