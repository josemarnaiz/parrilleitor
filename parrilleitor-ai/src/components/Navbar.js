'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { user } = useUser()
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState('ParrilleitorAI')
  
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-white">
      <div className="container">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            {showBackButton && (
              <Link href="/" className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>
            )}
            <h1 className="text-lg font-medium">{pageTitle}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {!user ? (
              <Link 
                href="/api/auth/login" 
                className="text-xs bg-white text-primary rounded-md px-3 py-1.5"
              >
                Iniciar Sesión
              </Link>
            ) : (
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {user.name?.charAt(0) || 'U'}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}