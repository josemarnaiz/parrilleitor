'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import Image from 'next/image'

export default function Navbar() {
  const { user, isLoading } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  
  // Detectar scroll para cambiar estilos del navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    // Throttle para mejor rendimiento
    let timeoutId
    const throttledScroll = () => {
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          handleScroll()
          timeoutId = null
        }, 100)
      }
    }
    
    window.addEventListener('scroll', throttledScroll)
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(timeoutId)
    }
  }, [])
  
  // Detectar clics fuera del menú móvil para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])
  
  // Prevenir scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])
  
  const closeMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = (e) => {
    e.preventDefault()
    window.location.href = '/api/auth/logout'
  }
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/90 shadow-lg backdrop-blur-md py-2' 
          : 'bg-transparent py-3'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 focus-visible:outline-none" onClick={closeMenu}>
            <Image 
              src="/images/logo.svg" 
              alt="ParrilleitorAI Logo" 
              width={28} 
              height={28} 
              className="rounded-full"
            />
            <span className="font-semibold text-lg md:text-xl">
              ParrilleitorAI
            </span>
          </Link>
          
          {/* Navegación de escritorio */}
          <div className="hidden md:flex items-center space-x-1">
            {isLoading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-800 rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/chat" 
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-800"
                >
                  Chat
                </Link>
                
                {/* Dropdown de usuario */}
                <div className="relative group">
                  <button 
                    className="flex items-center space-x-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sport-400"
                    aria-expanded={isMobileMenuOpen}
                    aria-label="Menú de usuario"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-700">
                      <Image 
                        src={user.picture || "https://via.placeholder.com/64"}
                        alt={user.name || "Usuario"} 
                        width={32} 
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate hidden sm:block">
                      {user.name?.split(' ')[0] || user.email?.split('@')[0] || "Usuario"}
                    </span>
                  </button>
                  
                  {/* Menú desplegable de escritorio */}
                  <div className="absolute right-0 mt-2 w-48 origin-top-right bg-gray-800 border border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1 px-1">
                      <div className="px-3 py-2 border-b border-gray-700">
                        <p className="text-xs font-medium text-gray-300 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link 
                        href="/admin/users" 
                        className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        Mi Cuenta
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                href="/api/auth/login" 
                className="btn btn-sport"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
          
          {/* Botón menú móvil */}
          <button
            className="md:hidden p-2 rounded-md transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sport-400"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span 
                className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span 
                className={`w-full h-0.5 bg-white rounded-full transition-all duration-200 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span 
                className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>
      
      {/* Menú móvil con animación */}
      <div 
        ref={mobileMenuRef}
        className={`fixed md:hidden inset-0 top-16 z-40 bg-black/95 backdrop-blur-md transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="container mx-auto px-4 py-4 h-full flex flex-col">
          {user ? (
            <>
              <div className="flex items-center space-x-3 p-3 mb-4 bg-gray-800/50 rounded-lg">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image 
                    src={user.picture || "https://via.placeholder.com/80"} 
                    alt={user.name || "Usuario"} 
                    width={40} 
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">
                    {user.name || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Link 
                  href="/chat" 
                  className="block w-full text-left px-4 py-3 rounded-lg text-white bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  onClick={closeMenu}
                >
                  Chat
                </Link>
                <Link 
                  href="/admin/users" 
                  className="block w-full text-left px-4 py-3 rounded-lg text-white bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  onClick={closeMenu}
                >
                  Mi Cuenta
                </Link>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-800">
                <button 
                  onClick={handleLogout}
                  className="block w-full text-center px-4 py-3 rounded-lg text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Link 
                href="/api/auth/login" 
                className="btn btn-sport w-full max-w-xs text-center py-3"
                onClick={closeMenu}
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 