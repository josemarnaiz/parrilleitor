'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'

export default function AdminUsers() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [userRoles, setUserRoles] = useState(null)
  const [error, setError] = useState(null)
  const [isTemporarySession, setIsTemporarySession] = useState(false)

  useEffect(() => {
    async function checkRoles() {
      try {
        const response = await fetch('/api/users/roles', {
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (data.user) {
          setUserRoles(data.user)
          
          // Verificar si es una sesión temporal
          if (data.user.isTemporary) {
            setIsTemporarySession(true)
            setError('Sesión temporal. Por favor recarga la página o inicia sesión nuevamente.')
          }
        } else if (data.error) {
          setError(data.error)
        }
      } catch (err) {
        setError(err.message)
      }
    }

    if (user) {
      checkRoles()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
        </div>
      </div>
    )
  }

  if (!user && !isTemporarySession) {
    // En lugar de redireccionar automáticamente, mostramos un botón para iniciar sesión
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Necesitas iniciar sesión</h1>
          <p className="mb-4">Para acceder a esta página, debes iniciar sesión primero.</p>
          <a 
            href="/api/auth/login" 
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Información de Usuario</h1>
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {userRoles && (
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Detalles del Usuario</h2>
                <p><span className="text-gray-400">Email:</span> {userRoles.email}</p>
                <p><span className="text-gray-400">Nombre:</span> {userRoles.name}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Roles</h2>
                {userRoles.roles.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {userRoles.roles.map(role => (
                      <li key={role} className="text-blue-400">{role}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No tiene roles asignados</p>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Estado Premium</h2>
                <p className={userRoles.isPremium ? "text-green-400" : "text-red-400"}>
                  {userRoles.isPremium ? "Usuario Premium ✓" : "Usuario No Premium ✗"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 