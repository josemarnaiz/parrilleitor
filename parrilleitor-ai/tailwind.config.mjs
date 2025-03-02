/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        // Colores principales
        sport: {
          50: '#ebf8ff',
          100: '#d6f0ff',
          200: '#b0e2ff',
          300: '#7ccbff',
          400: '#38aeff',
          500: '#0095ff', // Azul principal deportivo
          600: '#0077e6',
          700: '#0062cc',
          800: '#0050a6',
          900: '#004080',
        },
        nutrition: {
          50: '#f0fdec',
          100: '#dafbc6',
          200: '#b8f59b',
          300: '#8eeb68',
          400: '#65dd3c',
          500: '#4cd119', // Verde principal nutrición
          600: '#3cad13',
          700: '#2e8412',
          800: '#236712',
          900: '#1c4f12',
        },
        energy: {
          50: '#fff9eb',
          100: '#ffefc6',
          200: '#ffdf8a',
          300: '#ffc840',
          400: '#ffb81f',
          500: '#ff9d00', // Naranja energía
          600: '#e67a00',
          700: '#cc5f00',
          800: '#a34a00',
          900: '#853d00',
        },
        muscle: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // Rosa/rojo músculos
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        progress: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Púrpura progreso
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Mantener los colores originales para compatibilidad
        blue: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        heading: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        sport: ['Montserrat', 'Inter', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem', // 10px
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',     // 2px
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem',     // 6px
        'lg': '0.5rem',       // 8px
        'xl': '0.75rem',      // 12px
        '2xl': '1rem',        // 16px
        '3xl': '1.5rem',      // 24px
        'full': '9999px',
      },
      spacing: {
        '4xs': '0.125rem', // 2px
        '3xs': '0.25rem',  // 4px
        '2xs': '0.375rem', // 6px
        'xs': '0.5rem',    // 8px
        'sm': '0.75rem',   // 12px
        'md': '1rem',      // 16px
        'lg': '1.5rem',    // 24px
        'xl': '2rem',      // 32px
        '2xl': '2.5rem',   // 40px
        '3xl': '3rem',     // 48px
        '4xl': '4rem',     // 64px
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
        // Sombras con colores deportivos
        'sport': '0 10px 15px -3px rgba(0, 149, 255, 0.2), 0 4px 6px -2px rgba(0, 149, 255, 0.1)',
        'nutrition': '0 10px 15px -3px rgba(76, 209, 25, 0.2), 0 4px 6px -2px rgba(76, 209, 25, 0.1)',
        'energy': '0 10px 15px -3px rgba(255, 157, 0, 0.2), 0 4px 6px -2px rgba(255, 157, 0, 0.1)',
      },
      backgroundImage: {
        'hero-pattern': "url('/images/hero-bg.svg')",
        'gradient-sport': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-nutrition': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
      gradientColorStops: theme => ({
        'sport-start': theme('colors.sport.700'),
        'sport-end': theme('colors.sport.500'),
        'nutrition-start': theme('colors.nutrition.700'),
        'nutrition-end': theme('colors.nutrition.500'),
      }),
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out forwards',
        'slide-up': 'slideUp 0.5s ease-in-out forwards',
        'slide-down': 'slideDown 0.5s ease-in-out forwards',
        'slide-left': 'slideLeft 0.5s ease-in-out forwards',
        'slide-right': 'slideRight 0.5s ease-in-out forwards',
        'scale-in': 'scaleIn 0.3s ease-in-out forwards',
        'bounce-in': 'bounceIn 0.5s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '70%': { transform: 'scale(1.05)', opacity: 0.8 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      // Configuración de breakpoints para diseño mobile-first
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px', 
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    // Import tailwind forms plugin in an ES module compatible way
    {
      handler: function() {
        return import('@tailwindcss/forms').then(plugin => plugin.default());
      }
    },
  ],
  safelist: [
    // Clases de colores deportivos
    'bg-sport-500',
    'bg-nutrition-500',
    'bg-energy-500',
    'bg-muscle-500',
    'bg-progress-500',
    'text-sport-500',
    'text-nutrition-500',
    'text-energy-500',
    'text-muscle-500',
    'text-progress-500',
    'hover:bg-sport-600',
    'hover:bg-nutrition-600',
    'hover:bg-energy-600',
    'hover:bg-muscle-600',
    'hover:bg-progress-600',
    'border-sport-500',
    'border-nutrition-500',
    'border-energy-500',
    'shadow-sport',
    'shadow-nutrition',
    'shadow-energy',
    'bg-gradient-sport',
    'bg-gradient-nutrition',
    'from-sport-start',
    'to-sport-end',
    'from-nutrition-start',
    'to-nutrition-end',
    // Añadir clases originales para compatibilidad
    'bg-gray-800',
    'bg-gray-900',
    'text-white',
    'text-gray-300',
    'text-gray-400',
    'bg-blue-600',
    'hover:bg-blue-700',
    'flex',
    'items-center',
    'justify-between',
    'space-x-4',
    'p-4',
    'px-4',
    'py-2',
    'rounded',
    'rounded-lg',
    'font-bold',
    'text-xl',
    'transition-colors',
    'min-h-screen',
    'container',
    'mx-auto',
    'w-full',
    'max-w-4xl',
    'shadow-lg',
  ],
};
