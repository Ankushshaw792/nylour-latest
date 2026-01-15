import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))',
    				light: 'hsl(var(--primary-light))',
    				dark: 'hsl(var(--primary-dark))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))',
    				light: 'hsl(var(--secondary-light))',
    				dark: 'hsl(var(--secondary-dark))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			success: {
    				DEFAULT: 'hsl(var(--success))',
    				foreground: 'hsl(var(--success-foreground))'
    			},
    			warning: {
    				DEFAULT: 'hsl(var(--warning))',
    				foreground: 'hsl(var(--warning-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))',
    				hover: 'hsl(var(--card-hover))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		backgroundImage: {
    			'gradient-primary': 'var(--gradient-primary)',
    			'gradient-secondary': 'var(--gradient-secondary)',
    			'gradient-hero': 'var(--gradient-hero)',
    			'gradient-card': 'var(--gradient-card)'
    		},
    		boxShadow: {
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			glow: 'var(--shadow-glow)',
    			'2xs': 'var(--shadow-2xs)',
    			xs: 'var(--shadow-xs)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
    		},
    		transitionDuration: {
    			fast: '150ms',
    			normal: '300ms',
    			slow: '500ms'
    		},
    		borderRadius: {
    			lg: 'var(--radius-lg)',
    			md: 'var(--radius)',
    			sm: 'var(--radius-sm)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
			'scissor-cut': {
				'0%, 100%': {
					transform: 'rotate(0deg)'
				},
				'25%': {
					transform: 'rotate(-12deg)'
				},
				'50%': {
					transform: 'rotate(0deg)'
				},
				'75%': {
					transform: 'rotate(-12deg)'
				}
			},
			'scissor-cut-reverse': {
				'0%, 100%': {
					transform: 'rotate(0deg)'
				},
				'25%': {
					transform: 'rotate(12deg)'
				},
				'50%': {
					transform: 'rotate(0deg)'
				},
				'75%': {
					transform: 'rotate(12deg)'
				}
			},
			'hair-fall': {
				'0%': {
					opacity: '0',
					transform: 'translateY(0) rotate(0deg)'
				},
				'15%': {
					opacity: '0.8'
				},
				'100%': {
					opacity: '0',
					transform: 'translateY(25px) rotate(20deg)'
				}
			},
			'hair-sway': {
				'0%, 100%': {
					transform: 'rotate(0deg) translateX(0)'
				},
				'50%': {
					transform: 'rotate(0.5deg) translateX(1px)'
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'scissor-cut': 'scissor-cut 1s ease-in-out infinite',
			'scissor-cut-reverse': 'scissor-cut-reverse 1s ease-in-out infinite',
			'hair-fall': 'hair-fall 1.8s ease-out infinite',
			'hair-sway': 'hair-sway 3s ease-in-out infinite'
		},
    		fontFamily: {
    			sans: [
    				'Work Sans',
    				'ui-sans-serif',
    				'system-ui',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'Segoe UI',
    				'Roboto',
    				'Helvetica Neue',
    				'Arial',
    				'Noto Sans',
    				'sans-serif'
    			],
    			serif: [
    				'Lora',
    				'ui-serif',
    				'Georgia',
    				'Cambria',
    				'Times New Roman',
    				'Times',
    				'serif'
    			],
    			mono: [
    				'Inconsolata',
    				'ui-monospace',
    				'SFMono-Regular',
    				'Menlo',
    				'Monaco',
    				'Consolas',
    				'Liberation Mono',
    				'Courier New',
    				'monospace'
    			]
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
