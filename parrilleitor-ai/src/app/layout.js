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
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#000000',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${poppins.variable} ${inter.variable} scroll-smooth`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-black text-white overflow-x-hidden">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-grow w-full">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
