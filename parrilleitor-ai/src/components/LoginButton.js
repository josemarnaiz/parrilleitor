'use client'

import { useCallback } from 'react'

export default function LoginButton({ className }) {
  // Función para manejar el login con redirección directa
  const handleLogin = useCallback(() => {
    // Construir la URL de login directamente
    const loginUrl = '/api/auth/login'
    
    // Usar window.location para redirección directa (evita fetch y CORS)
    window.location.href = loginUrl
  }, [])

  return (
    <button
      onClick={handleLogin}
      className={`bg-primary hover:bg-primary-dark text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors shadow-sm hover:shadow-md ${className || ''}`}
      style={{
        backgroundImage: 'linear-gradient(to bottom, var(--primary-light), var(--primary))',
        transform: 'translateY(0)',
        transition: 'all 0.2s ease'
      }}
    >
      Iniciar sesión
    </button>
  )
} 