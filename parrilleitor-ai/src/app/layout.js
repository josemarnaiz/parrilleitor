import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'

// Configuración de fuentes optimizadas
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'ParrilleitorAI - Tu Asistente de Nutrición y Ejercicio',
  description: 'Asistente de IA especializado en nutrición deportiva y ejercicio personalizado para alcanzar tus objetivos de fitness',
  keywords: 'fitness, nutrición, ejercicio, entrenamiento personalizado, IA, asistente virtual',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

// Nueva exportación para configuraciones de viewport según recomendaciones de Next.js 14
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#121212',
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${poppins.variable} ${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#121212] text-white">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-grow w-full">
              {children}
            </main>
            <footer className="bg-[#0a0a0a] border-t border-gray-800 py-8">
              <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <div className="flex items-center mb-4">
                      <img src="/images/logo.svg" alt="ParrilleitorAI Logo" className="w-8 h-8 mr-2" />
                      <span className="text-xl font-bold">ParrilleitorAI</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Tu asistente personal de nutrición y ejercicio potenciado por IA, diseñado para ayudarte a alcanzar tus objetivos fitness.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
                    <ul className="space-y-2">
                      <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Inicio</a></li>
                      <li><a href="/chat" className="text-gray-400 hover:text-white transition-colors">Chat con IA</a></li>
                      <li><a href="/api/auth/login" className="text-gray-400 hover:text-white transition-colors">Iniciar Sesión</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contacto</h3>
                    <p className="text-gray-400 text-sm mb-2">¿Tienes preguntas o sugerencias?</p>
                    <a href="mailto:info@parrilleitorai.com" className="text-primary-400 hover:text-primary-300 transition-colors">
                      info@parrilleitorai.com
                    </a>
                    <div className="mt-4 flex space-x-4">
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} ParrilleitorAI. Todos los derechos reservados.
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
