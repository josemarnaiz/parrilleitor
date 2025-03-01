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
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-primary-500/30 rounded-full mb-4 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-500/50 rounded-full"></div>
            </div>
            <div className="h-4 w-36 bg-gray-700 rounded mb-3"></div>
            <div className="h-2 w-24 bg-gray-700 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center py-16 md:py-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              <span className="text-gradient-primary">ParrilleitorAI</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-slide-up">
              Tu asistente personal de nutrición y ejercicio potenciado por IA, diseñado para ayudarte a alcanzar tus objetivos fitness.
            </p>
            
            <div className="animate-slide-up delay-200">
              {user ? (
                <Link
                  href="/chat"
                  className="btn btn-primary px-8 py-3 text-lg"
                >
                  Iniciar Conversación
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href="/api/auth/login"
                  className="btn btn-primary px-8 py-3 text-lg"
                >
                  Comenzar Ahora
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient-primary">Características Principales</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Descubre cómo ParrilleitorAI puede transformar tu experiencia fitness con estas potentes funcionalidades.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              title="Nutrición Personalizada" 
              description="Recibe planes de alimentación adaptados a tus objetivos, preferencias y restricciones dietéticas."
              icon="/images/nutrition.svg"
              color="primary"
            />
            <FeatureCard 
              title="Rutinas de Ejercicio" 
              description="Obtén rutinas de entrenamiento diseñadas específicamente para tu nivel de condición física y metas."
              icon="/images/workout.svg"
              color="secondary"
            />
            <FeatureCard 
              title="Seguimiento de Progreso" 
              description="Monitorea tu evolución con análisis detallados y ajustes continuos para maximizar resultados."
              icon="/images/progress.svg"
              color="accent"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-glass">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient-secondary">Beneficios</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Experimenta las ventajas de contar con un asistente de IA especializado en tu bienestar.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BenefitCard 
              title="Ahorra Tiempo" 
              description="Planes instantáneos sin necesidad de investigar durante horas."
              iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              color="primary"
            />
            <BenefitCard 
              title="Personalización" 
              description="Recomendaciones adaptadas a tus necesidades específicas."
              iconPath="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              color="secondary"
            />
            <BenefitCard 
              title="Basado en Ciencia" 
              description="Consejos fundamentados en investigación nutricional y deportiva."
              iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              color="accent"
            />
            <BenefitCard 
              title="Mejora Continua" 
              description="El sistema aprende y se adapta a tus progresos y feedback."
              iconPath="M13 10V3L4 14h7v7l9-11h-7z"
              color="primary"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-[#0a0a0a]">
          <div className="container mx-auto">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-gradient-accent">¿Listo para transformar tu fitness?</span>
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                Únete ahora y comienza a recibir asesoramiento personalizado.
              </p>
              <Link 
                href="/api/auth/login"
                className="btn btn-primary px-8 py-3 text-lg"
              >
                Comenzar Ahora
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

function FeatureCard({ title, description, icon, color }) {
  return (
    <div className="feature-card">
      <div className="flex flex-col items-start gap-4">
        <div className={`rounded-full p-3 bg-${color}-500/20 text-${color}-400`}>
          <Image 
            src={icon} 
            alt={title} 
            width={24} 
            height={24} 
            className="w-6 h-6" 
          />
        </div>
        <div>
          <h3 className={`text-${color}-400 font-bold text-xl mb-2`}>{title}</h3>
          <p className="text-gray-300">{description}</p>
        </div>
      </div>
    </div>
  )
}

function BenefitCard({ title, description, iconPath, color }) {
  return (
    <div className="benefit-card">
      <div className={`rounded-full p-3 mb-4 bg-${color}-500/20 w-fit text-${color}-400`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <h3 className={`text-${color}-400 font-bold text-lg mb-2`}>{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  )
}
