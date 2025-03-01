'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Home() {
  const { user, isLoading } = useUser()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 bg-primary-500/30 rounded-full mb-4 flex items-center justify-center">
            <div className="w-5 h-5 bg-primary-500/50 rounded-full"></div>
          </div>
          <div className="h-3 w-24 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient-primary">ParrilleitorAI</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto mb-6">
            Tu asistente personal de nutrición y ejercicio potenciado por IA
          </p>
          
          <div>
            {user ? (
              <Link
                href="/chat"
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 rounded-full inline-flex items-center hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-primary-500/20"
              >
                Iniciar Conversación
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/api/auth/login"
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 rounded-full inline-flex items-center hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-primary-500/20"
              >
                Comenzar Ahora
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 border border-gray-800 rounded-xl p-4 backdrop-blur-sm hover:border-primary-500/50 transition-colors">
              <div className="flex items-start mb-3">
                <div className="bg-primary-500/10 rounded-lg p-2 mr-3">
                  <Image src="/images/nutrition.svg" alt="Nutrición" width={22} height={22} />
                </div>
                <h3 className="text-primary-400 font-medium text-lg">Nutrición Personalizada</h3>
              </div>
              <p className="text-gray-400 text-sm">Planes adaptados a tus objetivos y preferencias dietéticas</p>
            </div>
            
            <div className="bg-black/30 border border-gray-800 rounded-xl p-4 backdrop-blur-sm hover:border-secondary-500/50 transition-colors">
              <div className="flex items-start mb-3">
                <div className="bg-secondary-500/10 rounded-lg p-2 mr-3">
                  <Image src="/images/workout.svg" alt="Ejercicio" width={22} height={22} />
                </div>
                <h3 className="text-secondary-400 font-medium text-lg">Rutinas de Ejercicio</h3>
              </div>
              <p className="text-gray-400 text-sm">Entrenamiento diseñado para tu nivel y objetivos</p>
            </div>
            
            <div className="bg-black/30 border border-gray-800 rounded-xl p-4 backdrop-blur-sm hover:border-accent-500/50 transition-colors">
              <div className="flex items-start mb-3">
                <div className="bg-accent-500/10 rounded-lg p-2 mr-3">
                  <Image src="/images/progress.svg" alt="Progreso" width={22} height={22} />
                </div>
                <h3 className="text-accent-400 font-medium text-lg">Seguimiento</h3>
              </div>
              <p className="text-gray-400 text-sm">Monitoreo de tu evolución con ajustes continuos</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-10 px-4 mt-auto">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-block bg-black/30 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-3">
                <span className="text-gradient-accent">¿Listo para comenzar?</span>
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                Únete ahora y comienza a recibir asesoramiento personalizado
              </p>
              <Link 
                href="/api/auth/login"
                className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-5 py-2 rounded-full inline-flex items-center hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-accent-500/20 text-sm"
              >
                Comenzar Ahora
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
