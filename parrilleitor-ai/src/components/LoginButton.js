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
      className={`bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors ${className || ''}`}
    >
      Iniciar sesión
    </button>
  )
} 