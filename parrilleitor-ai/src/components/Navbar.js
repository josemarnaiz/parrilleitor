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
  
  // Detect scroll to change navbar styles
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    // Throttle for better performance
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
  
  // Detect clicks outside mobile menu to close it
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
  
  // Close mobile menu
  const closeMenu = () => {
    setIsMobileMenuOpen(false)
  }
  
  // Handle logout
  const handleLogout = (e) => {
    e.preventDefault()
    window.location.href = '/api/auth/logout'
  }
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <div className="container mx-auto">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/logo.svg" 
              alt="ParrilleitorAI Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold">ParrilleitorAI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-primary-400 transition-colors">
              Inicio
            </Link>
            <Link href="/chat" className="text-white hover:text-primary-400 transition-colors">
              Chat con IA
            </Link>
            
            {!isLoading && (
              <>
                {user ? (
                  <div className="relative group">
                    <button className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500">
                        <Image 
                          src={user.picture || 'https://via.placeholder.com/40'} 
                          alt={user.name || 'Usuario'} 
                          width={32} 
                          height={32} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{user.name?.split(' ')[0] || 'Usuario'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] rounded-md shadow-lg overflow-hidden z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                      <div className="py-2">
                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-primary-500 hover:text-white transition-colors">
                          Mi Perfil
                        </Link>
                        <Link href="/chat" className="block px-4 py-2 text-sm text-gray-300 hover:bg-primary-500 hover:text-white transition-colors">
                          Mis Conversaciones
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary-500 hover:text-white transition-colors"
                        >
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href="/api/auth/login" 
                    className="px-4 py-2 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>
      </div>
      
      {/* Mobile Menu */}
      <div 
        ref={mobileMenuRef}
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-64 bg-[#1a1a1a] shadow-xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <span className="text-lg font-bold">Menú</span>
            <button 
              className="text-white focus:outline-none"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="flex flex-col space-y-2 px-4">
              <Link 
                href="/" 
                className="py-2 text-white hover:text-primary-400 transition-colors"
                onClick={closeMenu}
              >
                Inicio
              </Link>
              <Link 
                href="/chat" 
                className="py-2 text-white hover:text-primary-400 transition-colors"
                onClick={closeMenu}
              >
                Chat con IA
              </Link>
              
              <div className="border-t border-gray-800 my-4"></div>
              
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-500">
                          <Image 
                            src={user.picture || 'https://via.placeholder.com/40'} 
                            alt={user.name || 'Usuario'} 
                            width={40} 
                            height={40} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{user.name || 'Usuario'}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="py-2 text-white hover:text-primary-400 transition-colors"
                        onClick={closeMenu}
                      >
                        Mi Perfil
                      </Link>
                      <Link 
                        href="/chat" 
                        className="py-2 text-white hover:text-primary-400 transition-colors"
                        onClick={closeMenu}
                      >
                        Mis Conversaciones
                      </Link>
                      <button 
                        onClick={(e) => {
                          closeMenu()
                          handleLogout(e)
                        }}
                        className="py-2 text-left text-white hover:text-primary-400 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <Link 
                      href="/api/auth/login" 
                      className="w-full py-2 rounded-md bg-primary-500 text-center text-white hover:bg-primary-600 transition-colors"
                      onClick={closeMenu}
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}