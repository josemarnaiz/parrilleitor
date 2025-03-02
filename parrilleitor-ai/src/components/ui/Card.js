'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

// Componente de contenedor principal de la tarjeta
const Card = React.forwardRef(({ 
  className, 
  children, 
  variant = 'default', 
  hover = false,
  animate = false,
  ...props 
}, ref) => {
  const Component = animate ? motion.div : 'div';
  
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    flat: 'bg-white shadow-none border border-gray-200',
    elevated: 'bg-white shadow-md border border-gray-100',
    colored: 'border-transparent',
    ghost: 'border border-gray-200 bg-transparent'
  };
  
  const hoverEffects = hover ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-md' : '';
  
  const motionProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <Component
      ref={ref}
      className={cn(
        'rounded-lg overflow-hidden',
        variants[variant],
        hoverEffects,
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

// Componente de encabezado de la tarjeta
const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-4 sm:p-6 flex flex-col space-y-1.5', className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

// Componente de título de la tarjeta
const CardTitle = React.forwardRef(({ className, children, as = 'h3', ...props }, ref) => {
  const Component = as;
  return (
    <Component
      ref={ref}
      className={cn(
        'font-semibold text-lg leading-tight tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

CardTitle.displayName = 'CardTitle';

// Componente de descripción de la tarjeta
const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

// Componente de contenido de la tarjeta
const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-4 sm:p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

// Componente de pie de la tarjeta
const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-4 sm:p-6 flex items-center', className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

// Componente para realizar acciones dentro de la tarjeta
const CardActions = React.forwardRef(({ className, children, position = 'right', ...props }, ref) => {
  const positions = {
    'right': 'justify-end',
    'left': 'justify-start',
    'center': 'justify-center',
    'between': 'justify-between'
  };

  return (
    <div
      ref={ref}
      className={cn('flex gap-2', positions[position], className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardActions.displayName = 'CardActions';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardActions }; 