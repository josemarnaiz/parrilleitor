'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import Image from 'next/image'

export default function Navbar() {
  const { user, isLoading, error } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Efecto para detectar el scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Cerrar el menú móvil cuando se selecciona una opción
  const closeMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = (e) => {
    e.preventDefault()
    
    // Log para depuración
    console.log('Manual logout requested by user:', { 
      user: user?.email || 'unknown',
      timestamp: new Date().toISOString()
    })
    
    // Redireccionar al endpoint de logout
    window.location.href = '/api/auth/logout'
  }
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/95 shadow-lg backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="container-custom px-3 py-2 md:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <Image 
                src="/images/logo.svg" 
                alt="ParrilleitorAI Logo" 
                width={24} 
                height={24} 
                className="rounded-full mr-2"
              />
              <span className={`text-base md:text-xl font-bold transition-all ${isScrolled ? 'text-white' : 'text-white'}`}>
                ParrilleitorAI
              </span>
            </Link>
          </div>
          
          {/* Navegación de escritorio */}
          <div className="hidden md:flex items-center space-x-1">
            {isLoading ? (
              <div className="animate-pulse bg-gray-700 h-6 w-20 rounded"></div>
            ) : user ? (
              <>
                <Link 
                  href="/chat" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-white"
                >
                  Chat
                </Link>
                {/* Imagen de perfil y opciones de usuario */}
                <div className="relative group ml-2">
                  <div className="flex items-center cursor-pointer px-2 py-1 rounded-md hover:bg-gray-800">
                    <div className="mr-2">
                      <Image 
                        src={user.picture || "https://via.placeholder.com/32"} 
                        alt={user.name || "Usuario"} 
                        width={28} 
                        height={28} 
                        className="rounded-full"
                      />
                    </div>
                    <span className="text-sm text-white">
                      {user.name?.split(' ')[0] || user.email?.split('@')[0] || "Usuario"}
                    </span>
                  </div>
                  
                  {/* Menú desplegable */}
                  <div className="absolute right-0 w-48 mt-2 origin-top-right bg-gray-800 border border-gray-700 rounded-md shadow-lg hidden group-hover:block">
                    <div className="py-1">
                      <Link 
                        href="/admin/users" 
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        Mi Cuenta
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Link 
                href="/api/auth/login" 
                className="btn-sport text-sm px-4 py-2"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
          
          {/* Botón de menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-1 rounded-md text-white hover:bg-gray-800 focus:outline-none"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Icono de menú hamburguesa o X */}
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900/95 shadow-lg backdrop-blur-sm animate-fadeIn">
          <div className="px-3 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center p-2 border-b border-gray-800">
                  <Image 
                    src={user.picture || "https://via.placeholder.com/32"} 
                    alt={user.name || "Usuario"} 
                    width={24} 
                    height={24} 
                    className="rounded-full mr-2"
                  />
                  <div>
                    <p className="text-xs font-medium text-white">
                      {user.name || user.email?.split('@')[0] || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[150px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link 
                  href="/chat" 
                  className="block rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  onClick={closeMenu}
                >
                  Chat
                </Link>
                <Link 
                  href="/admin/users" 
                  className="block rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  onClick={closeMenu}
                >
                  Mi Cuenta
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link 
                href="/api/auth/login" 
                className="flex justify-center rounded-md px-3 py-2 text-sm font-medium bg-sport-500 text-white hover:bg-sport-600"
                onClick={closeMenu}
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 