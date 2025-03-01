import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'

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
  themeColor: '#ffb600',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-white text-gray-800">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-grow w-full mt-14">
              {children}
            </main>
            <footer className="py-3 text-center text-xs text-gray-500 border-t border-gray-200">
              <div className="container flex justify-between items-center">
                <p>&copy; {new Date().getFullYear()} ParrilleitorAI</p>
                <div className="flex gap-3">
                  <a href="#" className="text-gray-500">Términos</a>
                  <span>|</span>
                  <a href="#" className="text-gray-500">Privacidad</a>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
