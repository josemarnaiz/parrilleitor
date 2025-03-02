'use client';

import React from 'react';

/**
 * Componente de tarjeta para mostrar información de manera atractiva
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la tarjeta
 * @param {string} props.subtitle - Subtítulo de la tarjeta (opcional)
 * @param {React.ReactNode} props.icon - Icono para mostrar junto al título (opcional)
 * @param {React.ReactNode} props.children - Contenido de la tarjeta
 * @param {string} props.className - Clases adicionales para la tarjeta (opcional)
 * @param {string} props.variant - Variante de la tarjeta: 'default', 'primary', 'secondary', 'accent' (opcional)
 * @param {boolean} props.hoverable - Si la tarjeta debe tener efecto hover (opcional)
 * @param {Function} props.onClick - Función a ejecutar al hacer clic en la tarjeta (opcional)
 */
export default function Card({
  title,
  subtitle,
  icon,
  children,
  className = '',
  variant = 'default',
  hoverable = true,
  onClick,
}) {
  // Determinar las clases según la variante
  let variantClasses = '';
  
  switch (variant) {
    case 'primary':
      variantClasses = 'border-primary-light bg-primary-light/10';
      break;
    case 'secondary':
      variantClasses = 'border-secondary-light bg-secondary-light/10';
      break;
    case 'accent':
      variantClasses = 'border-accent-light bg-accent-light/10';
      break;
    default:
      variantClasses = 'border-gray-200 bg-white';
  }
  
  return (
    <div 
      className={`card border ${variantClasses} ${hoverable ? 'hover:shadow-lg hover:-translate-y-1' : ''} 
        transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || icon) && (
        <div className="flex items-center mb-4">
          {icon && <div className="mr-3">{icon}</div>}
          <div>
            {title && <h3 className="text-lg font-bold text-text-dark">{title}</h3>}
            {subtitle && <p className="text-sm text-text-medium mt-1">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className={title || icon ? 'mt-4' : ''}>
        {children}
      </div>
    </div>
  );
} 