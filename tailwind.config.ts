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
  			"exa-black": "#000911",
  			"exa-dark": "#272626",
  			"exa-gray": {
  				100: "#faf9f8",
  				200: "#f9f7f7",
  				300: "#e5e5e5",
  				400: "#d4d4d4",
  				500: "#bababa",
  				600: "#6b7280",
  				700: "#636262",
  				800: "#60646c",
  				900: "#374151",
  			},
  			"exa-blue": {
  				light: "#638dff",
  				DEFAULT: "#0040f0",
  				dark: "#001651",
  				border: "rgba(9, 114, 213, 0.32)",
  			},
  		},
  		animation: {
  			'fade-up': 'fade-up 0.5s ease-out forwards'
  		},
  		keyframes: {
  			'fade-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			}
  		},
  		fontFamily: {
  			diatype: ["ABC Diatype", "system-ui", "sans-serif"],
  			arizona: ["ABC Arizona Flare", "Georgia", "serif"],
  		},
  		boxShadow: {
  			tag: "0px 4px 12px 0px rgba(0,0,0,0.03), 0px 2px 5px 0px rgba(0,0,0,0.03)",
  			"button-sm": "0px 1px 3px 0px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.1)",
  			"toggle-elevated": "0px 18px 11px 0px rgba(137,102,26,0.01), 0px 10px 10px 0px rgba(137,102,26,0.04), 0px 6px 7px 0px rgba(137,102,26,0.07), 0px 2px 4px 0px rgba(137,102,26,0.08)",
  			"toggle-inset": "inset 0.5px 1px 2px 0px #e0d7c1",
  			"arrow-btn": "inset 0px -1.5px 2px 0px #638dff, inset 0px 0px 1px 0px #0043fb, inset 0px 0px 2px 0px #0043fb, inset 0px 0px 8px 0px #0043fb, inset 0px 0px 10px 0px #0043fb",
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;