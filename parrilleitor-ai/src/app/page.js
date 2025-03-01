'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <main className="min-h-screen pt-24">
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-20 h-20 bg-sport-500/30 rounded-full mb-8 flex items-center justify-center">
              <div className="w-10 h-10 bg-sport-500/50 rounded-full"></div>
            </div>
            <div className="h-6 w-64 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-40 bg-gray-700 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section con imagen de fondo */}
      <section className="hero-section pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="text-gradient-sport">ParrilleitorAI</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Tu asistente personal de nutrición y ejercicio potenciado por IA, diseñado para ayudarte a alcanzar tus objetivos fitness de forma personalizada.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  href="/chat"
                  className="btn-sport text-lg py-4 px-8"
                >
                  <span className="mr-2">Ir al Chat</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <Link 
                  href="/api/auth/login"
                  className="btn-sport text-lg py-4 px-8"
                >
                  <span className="mr-2">Iniciar Sesión</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          
          {/* Características destacadas en tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard 
              title="Planes Nutricionales Personalizados"
              description="Recibe recomendaciones específicas basadas en tus objetivos, preferencias alimenticias y necesidades calóricas."
              icon="/images/nutrition.svg"
              variant="nutrition"
            />
            <FeatureCard 
              title="Rutinas de Ejercicio Optimizadas"
              description="Obtén programas de entrenamiento adecuados a tu nivel, objetivos y tiempo disponible."
              icon="/images/workout.svg"
              variant="sport"
            />
            <FeatureCard 
              title="Seguimiento de Progreso"
              description="Monitorea tu evolución con análisis detallados y ajustes recomendados para maximizar resultados."
              icon="/images/progress.svg"
              variant="energy"
            />
          </div>
        </div>
      </section>
      
      {/* Sección de Beneficios */}
      <section className="py-24 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="heading-sport text-4xl md:text-5xl">Beneficios de ParrilleitorAI</h2>
            <p className="text-gray-300 max-w-3xl mx-auto mt-6">
              Nuestro asistente de IA está especializado exclusivamente en nutrición deportiva y entrenamiento, 
              ofreciéndote asesoramiento de calidad respaldado por conocimientos científicos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
        <section className="section-sport-gradient clip-polygon">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-8">¿Listo para alcanzar tus objetivos fitness?</h2>
              <p className="text-xl mb-10 max-w-3xl mx-auto">
                Únete ahora y comienza a recibir asesoramiento personalizado en nutrición y entrenamiento.
              </p>
              <Link 
                href="/api/auth/login"
                className="btn-energy text-lg py-4 px-8"
              >
                Empezar Ahora
              </Link>
            </div>
          </div>
        </section>
      )}
      
      {/* Footer simplificado */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 flex items-center">
              <Image 
                src="/images/logo.svg" 
                alt="ParrilleitorAI Logo" 
                width={40} 
                height={40} 
                className="mr-3 rounded-full"
              />
              <span className="text-xl font-bold">ParrilleitorAI</span>
            </div>
            <div className="text-gray-400 text-sm">
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
    <div className={`${cardClasses[variant]} relative`}>
      <div className="feature-icon">
        <Image src={icon} alt={title} width={40} height={40} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-300">{description}</p>
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
    <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colors[color]} bg-gray-700`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
