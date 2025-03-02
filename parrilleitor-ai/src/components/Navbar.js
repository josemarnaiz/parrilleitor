'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { usePathname } from 'next/navigation'
import LoginButton from './LoginButton'
import LogoutButton from './LogoutButton'

export default function Navbar() {
  const { user } = useUser()
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState('ParrilleitorAI')
  const [scrolled, setScrolled] = useState(false)
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Set page title based on current path
  useEffect(() => {
    if (pathname === '/') {
      setPageTitle('ParrilleitorAI')
    } else if (pathname === '/chat') {
      setPageTitle('Chat con AI')
    } else if (pathname === '/profile') {
      setPageTitle('Mi Perfil')
    } else {
      setPageTitle('ParrilleitorAI')
    }
  }, [pathname])
  
  // Show back button on pages other than home
  const showBackButton = pathname !== '/'
  
  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-primary/95 backdrop-blur-sm shadow-md' : 'bg-primary'}`}>
        <div className="container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              {showBackButton && (
                <Link href="/" className="mr-3 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </Link>
              )}
              <h1 className="text-lg font-semibold text-white animate-fade-in">{pageTitle}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {!user ? (
                <LoginButton className="text-sm" />
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/chat" className={`hidden sm:block text-sm text-white/90 hover:text-white px-3 py-1.5 rounded-lg ${pathname === '/chat' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                    Chat
                  </Link>
                  <Link href="/profile" className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-colors">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  </Link>
                  <LogoutButton className="text-sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Bottom Navigation - Only for authenticated users */}
      {user && (
        <div className="mobile-nav sm:hidden">
          <div className="flex justify-around items-center">
            <Link href="/" className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="mobile-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Inicio</span>
            </Link>
            <Link href="/chat" className={`mobile-nav-item ${pathname === '/chat' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="mobile-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chat</span>
            </Link>
            <Link href="/profile" className={`mobile-nav-item ${pathname === '/profile' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="mobile-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Perfil</span>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}