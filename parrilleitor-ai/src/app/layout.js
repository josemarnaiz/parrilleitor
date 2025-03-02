import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import { I18nProvider } from '@/i18n'
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
  themeColor: '#ff9500',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-gray-50 text-gray-800">
        <AuthProvider>
          <I18nProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-grow w-full pt-header pb-safe">
                {children}
              </main>
              <footer className="py-3 text-center text-xs text-gray-500 border-t border-gray-200 bg-white pb-safe">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                    <div className="flex items-center">
                      <span className="font-medium text-primary mr-1">ParrilleitorAI</span>
                      <span>&copy; {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex gap-4">
                      <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Términos</a>
                      <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Privacidad</a>
                      <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Ayuda</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
