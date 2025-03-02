import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/theme.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import ClientI18nProvider from '@/components/ClientI18nProvider'
import '@/styles/components/language-selector.css'

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  title: 'ParrilleitorAI',
  description: 'Asistente de nutrición y ejercicio personalizado',
  keywords: 'fitness, nutrición, ejercicio',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#5e60ce',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-light">
        <AuthProvider>
          <ClientI18nProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-grow w-full pt-header pb-safe animate-fade-in">
                <div className="container mx-auto px-4 py-6">
                  {children}
                </div>
              </main>
              <footer className="py-4 text-center text-sm text-medium border-t border-gray-200 bg-white pb-safe">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <div className="flex items-center">
                      <span className="font-bold text-primary mr-2">ParrilleitorAI</span>
                      <span>&copy; {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex gap-6">
                      <a href="#" className="text-medium hover:text-primary transition-colors">Términos</a>
                      <a href="#" className="text-medium hover:text-primary transition-colors">Privacidad</a>
                      <a href="#" className="text-medium hover:text-primary transition-colors">Ayuda</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </ClientI18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
