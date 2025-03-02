'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Definición de los estilos base y variantes del botón
const buttonVariants = cva(
  // Base común para todos los botones
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      // Variante de tamaño
      size: {
        xs: 'h-7 px-2 text-xs rounded',
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-11 px-6 text-base rounded-md',
        xl: 'h-12 px-8 text-lg rounded-lg',
      },
      // Variante de estilo
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-500',
        link: 'bg-transparent underline-offset-4 hover:underline text-primary hover:bg-transparent focus-visible:ring-primary-500',
        sport: 'bg-sport-500 text-white hover:bg-sport-600 active:bg-sport-700 focus-visible:ring-sport-500',
        nutrition: 'bg-nutrition-500 text-white hover:bg-nutrition-600 active:bg-nutrition-700 focus-visible:ring-nutrition-500',
        energy: 'bg-energy-500 text-white hover:bg-energy-600 active:bg-energy-700 focus-visible:ring-energy-500',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500',
      },
      // Variante de ancho completo
      fullWidth: {
        true: 'w-full',
      },
      // Variante con icono
      withIcon: {
        left: 'flex-row',
        right: 'flex-row-reverse',
        both: 'justify-between',
        only: 'p-0',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
      fullWidth: false,
    },
  }
);

// Componente Button con animaciones integradas
const Button = React.forwardRef(
  ({ 
    children, 
    className, 
    variant, 
    size, 
    fullWidth = false,
    withIcon,
    icon,
    iconRight,
    animate = true,
    as,
    href,
    ...props 
  }, ref) => {
    // Identificar si tenemos iconos y su posición
    let iconPosition = null;
    if (icon && !iconRight) iconPosition = 'left';
    else if (iconRight && !icon) iconPosition = 'right';
    else if (icon && iconRight) iconPosition = 'both';
    else if ((icon || iconRight) && !children) iconPosition = 'only';
    
    // Clases comunes para todos los tipos de botones
    const buttonClasses = cn(
      buttonVariants({ 
        variant, 
        size, 
        fullWidth, 
        withIcon: iconPosition
      }), 
      className
    );
    
    // Contenido del botón
    const buttonContent = (
      <>
        {icon && <span className={cn("inline-flex", children && "mr-2")}>{icon}</span>}
        {children}
        {iconRight && <span className={cn("inline-flex", children && "ml-2")}>{iconRight}</span>}
      </>
    );
    
    // Animaciones para el botón
    const buttonAnimation = {
      whileHover: animate ? { scale: 1.02 } : {},
      whileTap: animate ? { scale: 0.98 } : {},
      transition: { duration: 0.1 },
    };
    
    // Si se proporciona 'as' y es Link, o si hay un href, renderizar como Link
    if ((as === Link || as === 'Link' || as === 'link') || href) {
      const Component = animate ? motion.a : 'a';
      
      return (
        <Link href={href || '#'} passHref legacyBehavior>
          <Component
            className={buttonClasses}
            ref={ref}
            {...buttonAnimation}
            {...props}
          >
            {buttonContent}
          </Component>
        </Link>
      );
    }
    
    // Si se proporciona un componente personalizado mediante 'as'
    if (as && typeof as !== 'string') {
      const Component = as;
      return (
        <Component
          className={buttonClasses}
          ref={ref}
          {...props}
        >
          {buttonContent}
        </Component>
      );
    }
    
    // Por defecto, renderizar como botón
    const Component = animate ? motion.button : 'button';
    return (
      <Component
        className={buttonClasses}
        ref={ref}
        {...buttonAnimation}
        {...props}
      >
        {buttonContent}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants }; 