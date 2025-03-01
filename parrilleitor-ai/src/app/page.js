'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
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
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-white py-6 px-4">
        <div className="container">
          <h1 className="text-2xl font-semibold mb-2">
            ParrilleitorAI
          </h1>
          <p className="text-sm mb-4">
            Tu asistente personal de nutrición y ejercicio
          </p>
          
          {!user && (
            <Link
              href="/api/auth/login" 
              className="bg-white text-primary font-medium rounded-md px-5 py-2.5 inline-block"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-5 px-4">
        <div className="container">
          {user ? (
            <div className="card mb-5">
              <h2 className="text-lg font-medium mb-3">Bienvenido, {user.name?.split(' ')[0] || 'Usuario'}</h2>
              <p className="text-gray-600 text-sm mb-4">Continúa con tu plan personalizado o inicia una nueva conversación con tu asistente.</p>
              <Link
                href="/chat"
                className="bg-primary text-white rounded-md py-2.5 px-5 inline-block"
              >
                Iniciar Conversación
              </Link>
            </div>
          ) : (
            <div className="card mb-5">
              <h2 className="text-lg font-medium mb-3">Comienza tu viaje</h2>
              <p className="text-gray-600 text-sm mb-4">Inicia sesión para obtener recomendaciones personalizadas de nutrición y ejercicio.</p>
            </div>
          )}
          
          {/* Features Cards */}
          <h2 className="text-lg font-medium mb-3">¿Qué ofrecemos?</h2>
          <div className="grid grid-cols-1 gap-4 mb-5">
            <div className="card px-4 py-4 flex items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-lg text-primary flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19h16"></path><path d="M4 5h16"></path><path d="M4 12h16"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Nutrición Personalizada</h3>
                <p className="text-gray-600 text-sm">Planes adaptados a tus objetivos</p>
              </div>
            </div>
            
            <div className="card px-4 py-4 flex items-start">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg text-secondary flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 1 1 0 8h-1"></path><path d="M6 8h-1a4 4 0 0 0 0 8h1"></path><path d="M8 8v8"></path><path d="M16 8v8"></path><path d="M12 8v8"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Rutinas de Ejercicio</h3>
                <p className="text-gray-600 text-sm">Entrenamiento para tu nivel</p>
              </div>
            </div>
            
            <div className="card px-4 py-4 flex items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-lg text-primary flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Seguimiento</h3>
                <p className="text-gray-600 text-sm">Monitoreo de tu evolución</p>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          {!user && (
            <div className="bg-primary text-white rounded-xl p-5 text-center">
              <h2 className="text-lg font-semibold mb-2">¿Listo para comenzar?</h2>
              <p className="text-sm mb-4">Únete ahora y recibe asesoramiento personalizado</p>
              <Link 
                href="/api/auth/login"
                className="bg-white text-primary font-medium rounded-md px-5 py-2 inline-block"
              >
                Comenzar
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
