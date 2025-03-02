'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Componente de botón atractivo y vibrante con diferentes variantes
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {string} props.variant - Variante del botón: 'primary', 'secondary', 'accent', 'outline', 'ghost' (opcional)
 * @param {string} props.size - Tamaño del botón: 'sm', 'md', 'lg' (opcional)
 * @param {string} props.className - Clases adicionales para el botón (opcional)
 * @param {boolean} props.fullWidth - Si el botón debe ocupar todo el ancho disponible (opcional)
 * @param {boolean} props.disabled - Si el botón está deshabilitado (opcional)
 * @param {string} props.href - URL para convertir el botón en un enlace (opcional)
 * @param {React.ReactNode} props.leftIcon - Icono para mostrar a la izquierda del texto (opcional)
 * @param {React.ReactNode} props.rightIcon - Icono para mostrar a la derecha del texto (opcional)
 * @param {Function} props.onClick - Función a ejecutar al hacer clic en el botón (opcional)
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  disabled = false,
  href,
  leftIcon,
  rightIcon,
  onClick,
  ...props
}) {
  // Determinar las clases según la variante
  let variantClasses = '';
  
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-primary hover:bg-primary-dark text-white';
      break;
    case 'secondary':
      variantClasses = 'bg-secondary hover:bg-secondary-dark text-white';
      break;
    case 'accent':
      variantClasses = 'bg-accent hover:bg-accent-dark text-white';
      break;
    case 'outline':
      variantClasses = 'bg-transparent border border-primary text-primary hover:bg-primary/5';
      break;
    case 'ghost':
      variantClasses = 'bg-transparent text-primary hover:bg-primary/5';
      break;
    default:
      variantClasses = 'bg-primary hover:bg-primary-dark text-white';
  }
  
  // Determinar las clases según el tamaño
  let sizeClasses = '';
  
  switch (size) {
    case 'sm':
      sizeClasses = 'text-sm py-1 px-3';
      break;
    case 'lg':
      sizeClasses = 'text-lg py-3 px-6';
      break;
    default:
      sizeClasses = 'text-base py-2 px-4';
  }
  
  // Clases comunes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${fullWidth ? 'w-full' : ''}
    ${variantClasses}
    ${sizeClasses}
    ${className}
  `;
  
  // Si hay un href, renderizar como Link
  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses} {...props}>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Link>
    );
  }
  
  // De lo contrario, renderizar como botón
  return (
    <button
      className={baseClasses}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
} 