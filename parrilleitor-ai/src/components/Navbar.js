'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Navbar() {
  const { user, isLoading } = useUser()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Detectar scroll para cambiar la apariencia de la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Función para manejar el logout de forma explícita
  const handleLogout = (e) => {
    e.preventDefault()
    
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    
    // Registrar el intento de logout
    console.log('Manual logout requested by user:', {
      email: user?.email,
      timestamp: new Date().toISOString()
    })
    
    // Redirigir al endpoint de logout
    window.location.href = '/api/auth/logout'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navClass = isScrolled 
    ? "fixed w-full top-0 bg-gray-800/95 backdrop-blur-md shadow-lg transition-all duration-300 z-50"
    : "fixed w-full top-0 bg-transparent transition-all duration-300 z-50"

  if (isLoading) {
    return (
      <nav className={navClass}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-white flex items-center">
              <div className="w-10 h-10 mr-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sport-500 via-nutrition-500 to-energy-500 rounded-full animate-pulse-slow"></div>
                <div className="absolute inset-0.5 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
              </div>
              <span className="text-gradient-sport">ParrilleitorAI</span>
            </Link>
            <div className="space-x-4">
              <span className="text-gray-400">Cargando...</span>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className={navClass}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-white flex items-center">
            <div className="w-10 h-10 mr-2 relative">
              <Image
                src="/images/logo.svg"
                alt="ParrilleitorAI Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            <span className="text-gradient-sport hidden sm:inline">ParrilleitorAI</span>
          </Link>
          
          {/* Navegación para escritorio */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  href="/chat" 
                  className="text-white hover:text-sport-400 transition-colors"
                >
                  <span className="font-semibold">Chat</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="text-white hover:text-nutrition-400 transition-colors"
                >
                  <span className="font-semibold">Mi Cuenta</span>
                </Link>
                <div className="flex items-center">
                  <div className="flex items-center space-x-3 border-l border-gray-700 pl-6">
                    <div className="w-8 h-8 rounded-full bg-sport-800 flex items-center justify-center overflow-hidden">
                      {user.picture ? (
                        <Image
                          src={user.picture}
                          alt={user.name || user.email}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-gray-300 text-sm hidden lg:inline-block">
                      {user.name || user.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-gray-300 hover:text-red-400 transition-colors text-sm"
                >
                  {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                </button>
              </>
            ) : (
              <Link 
                href="/api/auth/login"
                className="btn-sport"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
          
          {/* Botón menú móvil */}
          <button 
            className="md:hidden text-white"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-800 mt-2 py-3 px-4 rounded-lg shadow-lg">
            {user ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-700">
                  <div className="w-8 h-8 rounded-full bg-sport-800 flex items-center justify-center overflow-hidden">
                    {user.picture ? (
                      <Image
                        src={user.picture}
                        alt={user.name || user.email}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-gray-300 text-sm">
                    {user.name || user.email}
                  </span>
                </div>
                <Link 
                  href="/chat" 
                  className="text-white py-2 block hover:bg-gray-700 px-3 rounded-md transition-colors"
                >
                  Chat
                </Link>
                <Link
                  href="/admin/users"
                  className="text-white py-2 block hover:bg-gray-700 px-3 rounded-md transition-colors"
                >
                  Mi Cuenta
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-red-400 hover:text-red-300 py-2 text-left block px-3 rounded-md transition-colors"
                >
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                </button>
              </div>
            ) : (
              <Link 
                href="/api/auth/login"
                className="btn-sport w-full justify-center py-2"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
} 