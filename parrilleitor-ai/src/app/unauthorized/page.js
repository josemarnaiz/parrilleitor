'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'

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
            Lo sentimos, {user?.email}. Para acceder al chat necesitas una cuenta premium.
          </p>
          <div className="space-y-6">
            <p className="text-md text-gray-400">
              La cuenta premium te permite:
            </p>
            <ul className="text-gray-300 space-y-2">
              <li>✓ Acceso ilimitado al chat de IA</li>
              <li>✓ Recomendaciones personalizadas</li>
              <li>✓ Planes de nutrición adaptados</li>
              <li>✓ Rutinas de ejercicio personalizadas</li>
            </ul>
            <p className="text-md text-gray-400 mt-8">
              Para obtener acceso premium, por favor contacta al administrador.
            </p>
          </div>
          
          <div className="mt-12">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
} 