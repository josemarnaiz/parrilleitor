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
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/logo.svg" 
              alt="ParrilleitorAI" 
              width={28} 
              height={28} 
              className="w-7 h-7"
            />
            <span className="text-lg font-medium">ParrilleitorAI</span>
          </Link>
          
          {/* Navigation */}
          <div className="flex items-center space-x-6">
            <Link href="/chat" className="hidden md:block text-sm text-gray-300 hover:text-white transition-colors">
              Chat
            </Link>
            
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center">
                    <Link href="/chat" className="mr-4 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-full px-4 py-1.5 transition-colors">
                      Iniciar Chat
                    </Link>
                    <button 
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="flex items-center space-x-1 text-gray-300 hover:text-white"
                    >
                      <span className="hidden md:block text-sm">{user.name?.split(' ')[0]}</span>
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-primary-500/50">
                        <Image 
                          src={user.picture || 'https://via.placeholder.com/40'} 
                          alt={user.name || 'Usuario'} 
                          width={28} 
                          height={28} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/api/auth/login" 
                    className="text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-full px-4 py-1.5 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
      
      {/* Mobile Menu (Simplified) */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="absolute right-0 mt-2 w-48 bg-black border border-gray-800 rounded-md shadow-lg overflow-hidden z-10"
        >
          <div className="py-1">
            <Link href="/chat" className="block px-4 py-2 text-sm text-gray-300 hover:bg-primary-700 hover:text-white">
              Chat con IA
            </Link>
            {user && (
              <>
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-primary-700 hover:text-white">
                  Mi Perfil
                </Link>
                <Link href="/api/auth/logout" className="block px-4 py-2 text-sm text-gray-300 hover:bg-primary-700 hover:text-white">
                  Cerrar Sesión
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}