'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'

export default function Navbar() {
  const { user, isLoading } = useUser()

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

  return (
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
              <a 
                href="/api/auth/logout"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Cerrar Sesión
              </a>
            </>
          ) : (
            <a 
              href="/api/auth/login"
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </a>
          )}
        </div>
      </div>
    </nav>
  )
} 