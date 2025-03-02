'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

// Componente de entrada de texto avanzado
const Input = React.forwardRef(({ 
  className, 
  type = 'text',
  label,
  helperText,
  error,
  prefixIcon,
  suffixIcon,
  fullWidth = false,
  size = 'md',
  variant = 'default',
  showCount = false,
  maxLength,
  ...props 
}, ref) => {
  const [count, setCount] = useState(props.value?.length || 0);
  
  // Tamaños disponibles
  const sizes = {
    sm: 'h-8 text-sm px-3 py-1 rounded',
    md: 'h-10 text-base px-4 py-2 rounded-md',
    lg: 'h-12 text-lg px-6 py-3 rounded-lg',
  };
  
  // Variantes de estilo
  const variants = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    filled: 'bg-gray-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500',
    unstyled: 'border-transparent focus:ring-0 p-0 h-auto',
  };
  
  // Estado de error
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  
  // Control para la entrada con iconos
  const handleInputChange = (e) => {
    if (maxLength && showCount) {
      setCount(e.target.value.length);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };
  
  return (
    <div className={cn(
      'flex flex-col gap-1', 
      fullWidth && 'w-full',
      className
    )}>
      {/* Etiqueta del campo */}
      {label && (
        <label 
          htmlFor={props.id} 
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      {/* Contenedor de la entrada con posibles iconos */}
      <div className="relative flex items-center">
        {prefixIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-gray-500">
            {prefixIcon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            'w-full flex transition duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-0',
            sizes[size],
            variants[variant],
            errorStyles,
            prefixIcon && 'pl-10',
            suffixIcon && 'pr-10',
            (maxLength && showCount) && 'pr-16',
          )}
          ref={ref}
          onChange={handleInputChange}
          maxLength={maxLength}
          {...props}
        />
        
        {suffixIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-gray-500">
            {suffixIcon}
          </div>
        )}
        
        {/* Contador de caracteres */}
        {maxLength && showCount && (
          <div className="absolute right-3 flex items-center pointer-events-none">
            <span className={cn(
              "text-xs",
              count > maxLength * 0.9 ? "text-orange-500" : "text-gray-500",
              count >= maxLength && "text-red-500"
            )}>
              {count}/{maxLength}
            </span>
          </div>
        )}
      </div>
      
      {/* Texto de ayuda o error */}
      {(helperText || error) && (
        <p className={cn(
          "text-xs mt-1",
          error ? "text-red-500" : "text-gray-500"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input }; 