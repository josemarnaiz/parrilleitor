import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'ParrilleitorAI - Tu Asistente de Nutrición y Ejercicio',
  description: 'Asistente de IA especializado en nutrición y ejercicio',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-900 font-sans text-white">
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <div className="container-custom py-6">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
