'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <main className="min-h-screen pt-16">
        <div className="container-custom mx-auto px-3 py-8 flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-sport-500/30 rounded-full mb-4 md:mb-6 flex items-center justify-center">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-sport-500/50 rounded-full"></div>
            </div>
            <div className="h-4 md:h-5 w-36 md:w-48 bg-gray-700 rounded mb-3"></div>
            <div className="h-3 w-24 md:w-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section con imagen de fondo */}
      <section className="hero-section pt-16 md:pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900"></div>
        <div className="container-custom mx-auto px-4 py-6 md:py-12 lg:py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-6 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-5 leading-tight">
              <span className="text-gradient-sport">ParrilleitorAI</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-5 max-w-3xl mx-auto px-2">
              Tu asistente personal de nutrición y ejercicio potenciado por IA, diseñado para ayudarte a alcanzar tus objetivos fitness.
            </p>
            
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Link
                  href="/chat"
                  className="btn-sport text-sm sm:text-base py-2 px-5 md:py-3 md:px-6"
                >
                  <span className="mr-2">Ir al Chat</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <Link 
                  href="/api/auth/login"
                  className="btn-sport text-sm sm:text-base py-2 px-5 md:py-3 md:px-6"
                >
                  <span className="mr-2">Iniciar Sesión</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          
          {/* Características destacadas en tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            <FeatureCard 
              title="Planes Nutricionales"
              description="Recomendaciones específicas basadas en tus objetivos y preferencias."
              icon="/images/nutrition.svg"
              variant="nutrition"
            />
            <FeatureCard 
              title="Rutinas de Ejercicio"
              description="Programas de entrenamiento adecuados a tu nivel y objetivos."
              icon="/images/workout.svg"
              variant="sport"
            />
            <FeatureCard 
              title="Seguimiento"
              description="Monitorea tu evolución con análisis y ajustes recomendados."
              icon="/images/progress.svg"
              variant="energy"
            />
          </div>
        </div>
      </section>
      
      {/* Sección de Beneficios */}
      <section className="py-10 md:py-16 lg:py-24 bg-gray-800">
        <div className="container-custom mx-auto px-4">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="heading-sport text-2xl sm:text-3xl md:text-4xl">Beneficios de ParrilleitorAI</h2>
            <p className="text-gray-300 max-w-3xl mx-auto mt-3 md:mt-4 text-sm md:text-base px-2">
              Nuestro asistente de IA está especializado en nutrición deportiva y entrenamiento, 
              ofreciéndote asesoramiento de calidad respaldado por conocimientos científicos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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
        <section className="section-sport-gradient clip-polygon py-10 md:py-16">
          <div className="container-custom mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-5">¿Listo para alcanzar tus objetivos fitness?</h2>
              <p className="text-sm sm:text-base md:text-lg mb-5 md:mb-8 max-w-3xl mx-auto px-2">
                Únete ahora y comienza a recibir asesoramiento personalizado.
              </p>
              <Link 
                href="/api/auth/login"
                className="btn-energy text-sm sm:text-base py-2 px-5 md:py-3 md:px-6"
              >
                Empezar Ahora
              </Link>
            </div>
          </div>
        </section>
      )}
      
      {/* Footer simplificado */}
      <footer className="bg-gray-900 text-white py-6 md:py-8">
        <div className="container-custom mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-3 sm:mb-0 flex items-center">
              <Image 
                src="/images/logo.svg" 
                alt="ParrilleitorAI Logo" 
                width={28} 
                height={28} 
                className="mr-2 rounded-full"
              />
              <span className="text-base md:text-lg font-bold">ParrilleitorAI</span>
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
  const cardClasses = {
    nutrition: "nutrition-card",
    sport: "sport-card",
    energy: "energy-card"
  }

  return (
    <div className={`${cardClasses[variant]} relative p-4 md:p-5`}>
      <div className="feature-icon w-7 h-7 md:w-8 md:h-8 mb-2 md:mb-3">
        <Image src={icon} alt={title} width={32} height={32} className="w-full h-full" />
      </div>
      <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">{title}</h3>
      <p className="text-gray-300 text-xs sm:text-sm md:text-base">{description}</p>
    </div>
  )
}

function BenefitCard({ title, description, iconPath, color }) {
  const colors = {
    sport: "text-sport-500",
    nutrition: "text-nutrition-500",
    energy: "text-energy-500",
    muscle: "text-muscle-500",
    progress: "text-progress-500"
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 bg-gray-800 border border-gray-700 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-2 md:mb-3 ${colors[color]} bg-gray-700`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">{title}</h3>
      <p className="text-gray-400 text-xs sm:text-sm md:text-base">{description}</p>
    </div>
  )
}
