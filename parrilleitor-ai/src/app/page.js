'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Home() {
  const { user, isLoading } = useUser()
  const [mounted, setMounted] = useState(false)

  // Prevenir problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-sport-500/30 rounded-full mb-4 flex items-center justify-center">
              <div className="w-6 h-6 bg-sport-500/50 rounded-full"></div>
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
      <section className="hero-section pt-20 pb-12 md:pt-24 md:pb-20 px-4">
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              <span className="text-gradient-sport">ParrilleitorAI</span>
            </h1>
            <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-8 animate-slide-up">
              Tu asistente personal de nutrición y ejercicio potenciado por IA, diseñado para ayudarte a alcanzar tus objetivos fitness.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
              {user ? (
                <Link
                  href="/chat"
                  className="btn btn-sport w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>Ir al Chat</span>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <Link 
                  href="/api/auth/login"
                  className="btn btn-sport w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>Iniciar Sesión</span>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          
          {/* Características destacadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mt-12 md:mt-16">
            <div className="animate-slide-up delay-100">
              <FeatureCard 
                title="Planes Nutricionales"
                description="Recomendaciones específicas basadas en tus objetivos y preferencias alimenticias."
                icon="/images/nutrition.svg"
                variant="nutrition"
              />
            </div>
            <div className="animate-slide-up delay-200">
              <FeatureCard 
                title="Rutinas de Ejercicio"
                description="Programas de entrenamiento adecuados a tu nivel y objetivos."
                icon="/images/workout.svg"
                variant="sport"
              />
            </div>
            <div className="animate-slide-up delay-300">
              <FeatureCard 
                title="Seguimiento"
                description="Monitorea tu evolución con análisis y ajustes recomendados."
                icon="/images/progress.svg"
                variant="energy"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Sección de Beneficios */}
      <section className="py-12 md:py-16 bg-gray-900 bg-dots">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="heading heading-sport text-2xl md:text-3xl font-bold inline-block">
              Beneficios de ParrilleitorAI
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mt-6 text-sm md:text-base">
              Nuestro asistente de IA está especializado en nutrición deportiva y entrenamiento, 
              ofreciéndote asesoramiento de calidad respaldado por conocimientos científicos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <BenefitCard 
              title="Asesoramiento Personalizado"
              description="Adaptado a tus necesidades específicas y objetivos personales."
              iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              color="sport"
            />
            <BenefitCard 
              title="Basado en Ciencia"
              description="Recomendaciones fundamentadas en investigación científica actualizada."
              iconPath="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              color="nutrition"
            />
            <BenefitCard 
              title="Disponible 24/7"
              description="Consulta en cualquier momento sin esperas ni citas previas."
              iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              color="energy"
            />
            <BenefitCard 
              title="Respuestas Inmediatas"
              description="Obtén soluciones a tus dudas de forma rápida y precisa."
              iconPath="M13 10V3L4 14h7v7l9-11h-7z"
              color="muscle"
            />
          </div>
        </div>
      </section>
      
      {/* Sección CTA */}
      {!user && (
        <section className="section-sport-gradient clip-polygon py-12 md:py-16 px-4">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
                ¿Listo para alcanzar tus objetivos fitness?
              </h2>
              <p className="text-sm md:text-base mb-6 md:mb-8 max-w-2xl mx-auto text-gray-300">
                Únete ahora y comienza a recibir asesoramiento personalizado.
              </p>
              <Link 
                href="/api/auth/login"
                className="btn btn-energy"
              >
                Empezar Ahora
              </Link>
            </div>
          </div>
        </section>
      )}
      
      {/* Footer simplificado */}
      <footer className="bg-black text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <Image 
                src="/images/logo.svg" 
                alt="ParrilleitorAI Logo" 
                width={22} 
                height={22} 
                className="rounded-full mr-2"
              />
              <span className="text-base font-semibold">ParrilleitorAI</span>
            </div>
            <div className="text-gray-400 text-xs md:text-sm">
              &copy; {new Date().getFullYear()} ParrilleitorAI - Tu asistente de nutrición y ejercicio
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ title, description, icon, variant }) {
  return (
    <div className="feature-card">
      <div className="flex flex-row sm:flex-col md:flex-row items-start gap-3">
        <div className={`rounded-full p-2 bg-${variant}-500/20 flex-shrink-0 text-${variant}-400`}>
          <Image 
            src={icon} 
            alt={title} 
            width={24} 
            height={24} 
            className="w-5 h-5 md:w-6 md:h-6" 
          />
        </div>
        <div>
          <h3 className={`text-${variant}-400 font-bold text-base mb-1`}>{title}</h3>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
      </div>
    </div>
  )
}

function BenefitCard({ title, description, iconPath, color }) {
  return (
    <div className="benefit-card">
      <div className={`rounded-full p-2 mb-3 bg-${color}-500/20 w-fit text-${color}-400`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          className="w-5 h-5 md:w-6 md:h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <h3 className={`text-${color}-400 font-bold text-base mb-1`}>{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  )
}
