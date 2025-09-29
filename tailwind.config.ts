
import type {Config} from 'tailwindcss';

const dynamicTextSlideCount = 8; // Number of words in your dynamicWords array
const animationDuration = '20s';

const generateKeyframes = (count: number) => {
  const keyframes: { [key: string]: { transform: string } } = {};
  const stepPercentage = 100 / count;
  const itemHeight = 1.5; // Corresponds to h-[1.5em]

  for (let i = 0; i < count; i++) {
    const start = stepPercentage * i;
    // Stay on word for a portion of the step duration
    const end = start + (stepPercentage * 0.8); 
    keyframes[`${start.toFixed(2)}%, ${end.toFixed(2)}%`] = {
      transform: `translateY(-${itemHeight * i}em)`, // Use em units based on li height
    };
  }
   // Ensure it loops back smoothly by holding the last frame
   keyframes['100%'] = {
     transform: `translateY(-${itemHeight * (count - 1)}em)`,
   };

  return keyframes;
};


export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        cod: {
          bg: 'hsl(var(--cod-bg))',
          card: 'hsl(var(--cod-card))',
          border: 'hsl(var(--cod-border))',
          navy: 'hsl(var(--cod-navy))',
          orange: 'hsl(var(--cod-orange))',
          muted: 'hsl(var(--cod-muted))',
          glow: 'hsl(var(--cod-glow))',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'text-slide-y': generateKeyframes(dynamicTextSlideCount),
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'text-slide-y': `text-slide-y ${animationDuration} cubic-bezier(0.83, 0, 0.17, 1) infinite`,
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
