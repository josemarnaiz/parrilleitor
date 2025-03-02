'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import LoginButton from '../components/LoginButton'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, TrendingUp, Award, Users, Smartphone } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'

// Efecto de aparición escalonada para los elementos
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.48, 0.15, 0.25, 0.96]
    }
  })
};

export default function Home() {
  const { user, isLoading } = useUser()
  const [mounted, setMounted] = useState(false)

  // Prevenir problemas de hidratación
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
    <main className="flex flex-col min-h-screen">
      {/* Hero Section con gradiente y diseño mejorado */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Fondo con gradiente y patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-sport-600 via-primary to-energy-500 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-10 z-0"></div>
        
        {/* Contenido principal */}
        <div className="container relative z-10 px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto principal con animaciones */}
            <motion.div 
              className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                variants={fadeInUp}
                custom={0}
              >
                Tu asistente personal <span className="text-white/90">de nutrición y fitness</span>
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-white/80 mb-8"
                variants={fadeInUp}
                custom={1}
              >
                Alcanza tus objetivos de forma saludable con un plan personalizado 
                de alimentación y ejercicio adaptado a tus necesidades.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                variants={fadeInUp}
                custom={2}
              >
                {!user ? (
                  <LoginButton className="btn-primary text-base px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all">
                    Comenzar ahora
                  </LoginButton>
                ) : (
                  <Button 
                    as={Link}
                    href="/chat"
                    variant="primary"
                    size="lg"
                    iconRight={<ArrowRight size={18} />}
                    className="shadow-lg"
                  >
                    Ir al Chat
                  </Button>
                )}
                <Button
                  as={Link}
                  href="#features"
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  Conocer más
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Imagen o ilustración */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="relative w-full h-[500px] bg-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Aquí se podría agregar una imagen real de la app o una ilustración */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/30 text-2xl font-light">
                    Imagen de la aplicación
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Forma decorativa en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white rounded-t-[50px] z-10"></div>
      </section>
      
      {/* Sección de características principales */}
      <section id="features" className="py-20 bg-white relative z-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Potencia tus resultados con inteligencia artificial
            </h2>
            <p className="text-lg text-gray-600">
              Descubre cómo ParrilleitorAI transforma tu experiencia de nutrición y entrenamiento con tecnología avanzada.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Tarjeta de características 1 */}
            <Card
              hover
              animate
              className="border-t-4 border-t-sport-500"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-sport-100 flex items-center justify-center mb-4">
                  <CheckCircle size={24} className="text-sport-500" />
                </div>
                <CardTitle>Planes personalizados</CardTitle>
                <CardDescription>
                  Recibe recomendaciones adaptadas a tus necesidades, preferencias y objetivos específicos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {['Dietas adaptativas', 'Rutinas a medida', 'Ajustes en tiempo real'].map((item, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-sport-500 mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Tarjeta de características 2 */}
            <Card
              hover
              animate
              className="border-t-4 border-t-primary"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <TrendingUp size={24} className="text-primary" />
                </div>
                <CardTitle>Seguimiento inteligente</CardTitle>
                <CardDescription>
                  Monitoriza tu progreso con análisis avanzados y ajusta tu plan automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {['Análisis de tendencias', 'Detección de patrones', 'Sugerencias de mejora'].map((item, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-primary mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Tarjeta de características 3 */}
            <Card
              hover
              animate
              className="border-t-4 border-t-nutrition-500"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-nutrition-100 flex items-center justify-center mb-4">
                  <Award size={24} className="text-nutrition-500" />
                </div>
                <CardTitle>Asesoramiento experto</CardTitle>
                <CardDescription>
                  Accede a conocimiento basado en ciencia y experiencia profesional.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {['Recomendaciones científicas', 'Consejos prácticos', 'Respuestas a consultas'].map((item, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-nutrition-500 mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Sección de testimonios */}
      <section className="py-20 bg-gray-50">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-lg text-gray-600">
              Historias reales de personas que han transformado sus hábitos y logrado sus objetivos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Carlos M.",
                role: "Atleta amateur",
                content: "ParrilleitorAI me ha ayudado a optimizar mi nutrición y mejorar mis tiempos de recuperación. Los planes son súper personalizados.",
                image: "https://randomuser.me/api/portraits/men/54.jpg"
              },
              {
                name: "Laura G.",
                role: "Profesional ocupada",
                content: "Con mi agenda apretada, necesitaba algo eficiente. La app me da planes rápidos pero efectivos que puedo seguir sin complicaciones.",
                image: "https://randomuser.me/api/portraits/women/67.jpg"
              },
              {
                name: "Miguel S.",
                role: "Principiante en fitness",
                content: "Empecé sin saber nada de nutrición. La IA me ha guiado paso a paso y ahora entiendo mucho mejor cómo alimentarme correctamente.",
                image: "https://randomuser.me/api/portraits/men/32.jpg"
              }
            ].map((testimonial, i) => (
              <Card key={i} hover animate className="overflow-visible">
                <CardContent className="pt-8 relative">
                  <div className="absolute -top-6 left-4 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Sección CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-sport-600 text-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Comienza tu transformación hoy mismo
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Únete a miles de personas que ya están alcanzando sus metas con ParrilleitorAI.
                Tu plan personalizado te espera.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!user ? (
                  <LoginButton className="bg-white text-primary hover:bg-white/90 font-medium px-8 py-3 rounded-lg shadow-lg transition-all">
                    Crear cuenta gratis
                  </LoginButton>
                ) : (
                  <Button 
                    as={Link}
                    href="/chat"
                    variant="outline"
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 border-transparent"
                    iconRight={<ArrowRight size={18} />}
                  >
                    Ir a mi asistente
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm max-w-md">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Users size={20} className="mr-2" /> Únete a nuestra comunidad
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle size={20} className="mr-3 text-white flex-shrink-0 mt-1" />
                    <span>Acceso a planes personalizados de nutrición y entrenamiento</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={20} className="mr-3 text-white flex-shrink-0 mt-1" />
                    <span>Asistente IA disponible 24/7 para resolver tus dudas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={20} className="mr-3 text-white flex-shrink-0 mt-1" />
                    <span>Seguimiento de progreso y ajustes automáticos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={20} className="mr-3 text-white flex-shrink-0 mt-1" />
                    <span>Comunidad de apoyo y recursos exclusivos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ParrilleitorAI</h3>
              <p className="text-gray-400 mb-4">
                Tu asistente personal para alcanzar tus objetivos de nutrición y fitness.
              </p>
              <div className="flex space-x-4">
                {/* Iconos de redes sociales */}
                {['facebook', 'twitter', 'instagram'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label={`Síguenos en ${social}`}
                  >
                    <span className="sr-only">Síguenos en {social}</span>
                    <div className="w-4 h-4"></div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces rápidos</h4>
              <ul className="space-y-2">
                {['Inicio', 'Características', 'Testimonios', 'Contacto'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2">
                {['Blog', 'Guías', 'Soporte', 'Preguntas frecuentes'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Descarga la app</h4>
              <p className="text-gray-400 mb-4">
                Próximamente disponible para iOS y Android
              </p>
              <div className="flex flex-col space-y-2">
                <a href="#" className="flex items-center px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <Smartphone size={20} className="mr-2" />
                  <span>App Store</span>
                </a>
                <a href="#" className="flex items-center px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <Smartphone size={20} className="mr-2" />
                  <span>Google Play</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} ParrilleitorAI. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
