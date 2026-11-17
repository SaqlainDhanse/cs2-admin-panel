/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
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
    			theme: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
    				canvas: 'rgb(var(--theme-base-rgb) / <alpha-value>)',
    				panel: 'rgb(var(--theme-panel-rgb) / <alpha-value>)',
    				hover: 'rgb(var(--theme-hover-rgb) / <alpha-value>)',
    				raised: 'rgb(var(--theme-raised-rgb) / <alpha-value>)',
    				line: {
    					DEFAULT: 'rgb(var(--theme-line-rgb) / <alpha-value>)',
    					subtle: 'rgb(var(--theme-line-subtle-rgb) / <alpha-value>)',
    					strong: 'rgb(var(--theme-line-strong-rgb) / <alpha-value>)'
    				},
    				ink: {
    					DEFAULT: 'rgb(var(--theme-ink-rgb) / <alpha-value>)',
    					muted: 'rgb(var(--theme-ink-muted-rgb) / <alpha-value>)',
    					faint: 'rgb(var(--theme-ink-faint-rgb) / <alpha-value>)',
    					ghost: 'rgb(var(--theme-ink-ghost-rgb) / <alpha-value>)'
    				},
    			border: 'rgb(var(--theme-line-rgb) / <alpha-value>)',
    			input: 'rgb(var(--theme-line-rgb) / <alpha-value>)',
    			ring: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
    			background: 'rgb(var(--theme-base-rgb) / <alpha-value>)',
    			foreground: 'rgb(var(--theme-ink-rgb) / <alpha-value>)',
    			primary: {
    					DEFAULT: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
    					foreground: '#000000'
    				},
    			secondary: {
    					DEFAULT: 'rgb(var(--theme-raised-rgb) / <alpha-value>)',
    					foreground: 'rgb(var(--theme-ink-rgb) / <alpha-value>)'
    				},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    					DEFAULT: 'rgb(var(--theme-hover-rgb) / <alpha-value>)',
    					foreground: 'rgb(var(--theme-ink-muted-rgb) / <alpha-value>)'
    				},
    			accent: {
    					DEFAULT: 'rgb(var(--theme-hover-rgb) / <alpha-value>)',
    					foreground: 'rgb(var(--theme-ink-rgb) / <alpha-value>)'
    				},
    			popover: {
    					DEFAULT: 'rgb(var(--theme-panel-rgb) / <alpha-value>)',
    					foreground: 'rgb(var(--theme-ink-rgb) / <alpha-value>)'
    				},
    			card: {
    					DEFAULT: 'rgb(var(--theme-panel-rgb) / <alpha-value>)',
    					foreground: 'rgb(var(--theme-ink-rgb) / <alpha-value>)'
    				},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: 0
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
    					height: 0
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
	plugins: [require('tailwindcss-animate')],
};
