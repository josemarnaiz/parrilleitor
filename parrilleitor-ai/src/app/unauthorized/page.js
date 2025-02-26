'use client'

import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'

export default function Unauthorized() {
  const { user } = useUser()

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-8">
            Acceso No Autorizado
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Lo sentimos, {user?.email}. No tienes acceso a esta sección.
          </p>
          <p className="text-md text-gray-400 mb-12">
            Esta es una versión privada de ParrilleitorAI. Si crees que deberías tener acceso, por favor contacta al administrador.
          </p>
          
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </main>
  )
} 