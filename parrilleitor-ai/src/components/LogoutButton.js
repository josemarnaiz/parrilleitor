'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton({ className, children }) {
  const router = useRouter()
  
  // Función para manejar el logout con redirección directa
  const handleLogout = useCallback(async () => {
    try {
      // En lugar de redireccionar directamente, hacemos una petición POST
      // para evitar problemas de CORS con Auth0
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        // Si la respuesta es exitosa, redirigimos a la página principal
        window.location.href = '/'
      } else {
        console.error('Error al cerrar sesión')
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }, [])

  return (
    <button
      onClick={handleLogout}
      className={`bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors ${className || ''}`}
    >
      {children || 'Cerrar sesión'}
    </button>
  )
} 