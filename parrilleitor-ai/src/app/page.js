'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'

export default function Home() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-8">
              Cargando...
            </h1>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-8">
            ParrilleitorAI
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Tu asistente personal de nutrición y ejercicio potenciado por IA
          </p>
          
          <div className="space-y-4">
            {user ? (
              <div className="space-y-8">
                <div className="text-white">
                  <h2 className="text-2xl mb-4">¡Bienvenido de nuevo, {user.name || user.email}!</h2>
                  <p className="text-gray-300">
                    Continúa tu conversación con tu asistente personal de nutrición y ejercicio.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Ir al Chat
                </Link>
              </div>
            ) : (
              <Link 
                href="/api/auth/login"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
            
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                ¿Qué puedo hacer por ti?
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <FeatureCard 
                  title="Planes Nutricionales"
                  description="Recibe recomendaciones personalizadas basadas en tus objetivos y preferencias"
                />
                <FeatureCard 
                  title="Rutinas de Ejercicio"
                  description="Obtén planes de entrenamiento adaptados a tu nivel y necesidades"
                />
                <FeatureCard 
                  title="Seguimiento"
                  description="Monitorea tu progreso y recibe ajustes en tiempo real"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
