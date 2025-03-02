import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina múltiples clases de Tailwind resolviendo conflictos automáticamente
 * @param {...string} inputs - Clases CSS a combinar
 * @returns {string} - Clases combinadas sin duplicados ni conflictos
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Genera variantes para elementos de interfaz basadas en el estado
 * @param {string} base - Clase base que siempre se aplica
 * @param {Object} variants - Objetos con variantes según estados
 * @param {Object} defaultVariants - Variantes predeterminadas
 * @returns {string} - Clases CSS finales combinadas
 */
export function cva(base, variants, defaultVariants = {}) {
  return ({ className, ...props }) => {
    const variantClasses = Object.entries(variants).reduce((acc, [variantName, variantOptions]) => {
      const variantValue = props[variantName] || defaultVariants[variantName];
      const variantClass = variantOptions[variantValue];
      if (variantClass) {
        acc.push(variantClass);
      }
      return acc;
    }, []);
    
    return cn(base, ...variantClasses, className);
  };
}

/**
 * Genera un ID único para elementos
 * @returns {string} - ID único
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 10);
}; 