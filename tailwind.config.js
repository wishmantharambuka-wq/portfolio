/**
 * The colour scale is defined in CSS variables (see src/index.css) rather
 * than as literals here, and the light theme *inverts* the ash ramp:
 * `ash-950` is the page background in both themes, `ash-50` is the strongest
 * text in both themes. That means every component keeps working in light
 * mode without a single `dark:` variant.
 *
 * Variables hold space-separated RGB channels so Tailwind's `<alpha-value>`
 * placeholder still gives us `bg-ash-900/60` and friends.
 */
const ash = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ash: {
          950: ash('--ash-950'),
          900: ash('--ash-900'),
          850: ash('--ash-850'),
          800: ash('--ash-800'),
          700: ash('--ash-700'),
          600: ash('--ash-600'),
          500: ash('--ash-500'),
          400: ash('--ash-400'),
          300: ash('--ash-300'),
          200: ash('--ash-200'),
          100: ash('--ash-100'),
          50: ash('--ash-50'),
        },
        // One accent per discipline, ordered by portfolio priority.
        ds: ash('--accent-ds'),
        gis: ash('--accent-gis'),
        gfx: ash('--accent-gfx'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
