module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Tokens do design system "Resolva" (apontam para as CSS vars em index.css)
        page: 'var(--bg-page)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          2: 'var(--bg-surface-2)',
          sunken: 'var(--bg-sunken)',
        },
        hover: 'var(--hover-bg)',
        chip: 'var(--chip-bg)',
        line: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          subtle: 'var(--border-subtle)',
        },
        ink: {
          900: 'var(--ink-900)',
          700: 'var(--ink-700)',
          500: 'var(--ink-500)',
          400: 'var(--ink-400)',
          300: 'var(--ink-300)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          tint: 'var(--brand-tint)',
          'tint-2': 'var(--brand-tint-2)',
        },
        'on-brand': 'var(--on-brand)',
        info: {
          bg: 'var(--info-bg)',
          border: 'var(--info-border)',
          fg: 'var(--info-fg)',
        },
        success: {
          bg: 'var(--success-bg)',
          border: 'var(--success-border)',
          fg: 'var(--success-fg)',
        },
        warn: {
          bg: 'var(--warn-bg)',
          border: 'var(--warn-border)',
          fg: 'var(--warn-fg)',
        },
        danger: {
          bg: 'var(--danger-bg)',
          border: 'var(--danger-border)',
          fg: 'var(--danger-fg)',
        },
        neutral: {
          bg: 'var(--neutral-bg)',
          border: 'var(--neutral-border)',
          fg: 'var(--neutral-fg)',
          dot: 'var(--neutral-dot)',
        },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      ringColor: {
        focus: 'var(--focus-ring)',
      },
    },
  },
  plugins: [],
}
