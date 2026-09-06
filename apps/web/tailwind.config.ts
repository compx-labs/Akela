import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import formsPlugin from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
    "../../node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    extend: {
      fontFamily: {
        sans: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "tremor-label": ["0.625rem", { lineHeight: "0.875rem" }],
        "tremor-default": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-title": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-metric": ["1.125rem", { lineHeight: "1.5rem" }],
      },
      colors: {
        void: "#000000",
        panel: "#0a0a0a",
        hair: "#3a3a3a",
        fg: "#ececec",
        muted: "#8f8f8f",
        label: "#ffb000",
        amber: {
          DEFAULT: "#ffb000",
          dim: "#a37200",
          ink: "#1a1200",
        },
        orange: {
          DEFAULT: "#ff7a1a",
          dim: "#9a4a10",
          ink: "#1a0c00",
        },
        up: "#3cff6b",
        down: "#ff4d4f",
        cyan: {
          DEFAULT: "#3ecfff",
          dim: "#1a6a88",
          ink: "#001018",
        },
        key: {
          home: "#ffb000",
          boards: "#ff7a1a",
          agents: "#00e676",
          formula: "#3ecfff",
          register: "#ececec",
        },
        tremor: {
          brand: {
            faint: "#111111",
            muted: "#ffb000",
            subtle: "#ff7a1a",
            DEFAULT: "#ffb000",
            emphasis: "#ffb000",
            inverted: colors.black,
          },
          background: {
            muted: colors.neutral[50],
            subtle: colors.neutral[100],
            DEFAULT: colors.white,
            emphasis: colors.neutral[700],
          },
          border: {
            DEFAULT: colors.neutral[200],
          },
          ring: {
            DEFAULT: colors.neutral[200],
          },
          content: {
            subtle: colors.neutral[400],
            DEFAULT: colors.neutral[500],
            emphasis: colors.neutral[700],
            strong: colors.neutral[900],
            inverted: colors.white,
          },
        },
        "dark-tremor": {
          brand: {
            faint: "#0a0a0a",
            muted: "#3a3a3a",
            subtle: "#ffb000",
            DEFAULT: "#ffb000",
            emphasis: "#ffb000",
            inverted: colors.black,
          },
          background: {
            muted: "#000000",
            subtle: "#0a0a0a",
            DEFAULT: "#0a0a0a",
            emphasis: "#ececec",
          },
          border: {
            DEFAULT: "#3a3a3a",
          },
          ring: {
            DEFAULT: "#3a3a3a",
          },
          content: {
            subtle: "#5c5c5c",
            DEFAULT: "#8f8f8f",
            emphasis: "#ececec",
            strong: "#ffffff",
            inverted: colors.black,
          },
        },
      },
      boxShadow: {
        "tremor-input": "none",
        "tremor-card": "none",
        "tremor-dropdown": "none",
        "dark-tremor-input": "none",
        "dark-tremor-card": "none",
        "dark-tremor-dropdown": "none",
      },
      borderRadius: {
        "tremor-small": "0",
        "tremor-default": "0",
        "tremor-full": "0",
      },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "data-[selected]"],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "data-[selected]"],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "data-[selected]"],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
  ],
  plugins: [formsPlugin],
};

export default config;
