'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  if (isLoading) {
    return (
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            ParrilleitorAI
          </Link>
          <div className="space-x-4">
            <span className="text-gray-400">Cargando...</span>
          </div>
        </div>
      </nav>
    )
  }

  const handleLogout = async () => {
    try {
      // Redirigir al endpoint de logout
      window.location.href = '/api/auth/logout'
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  return (
    <>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            ParrilleitorAI
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-300">
                  Bienvenido, {user.name || user.email}
                </span>
                <Link 
                  href="/chat" 
                  className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Chat
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Mi Cuenta
                </Link>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link 
                href="/api/auth/login"
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Modal de confirmación de logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              ¿Cerrar sesión?
            </h3>
            <p className="text-gray-300 mb-6">
              ¿Estás seguro de que deseas cerrar tu sesión?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 