'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { usePathname } from 'next/navigation'
import LoginButton from './LoginButton'
import LogoutButton from './LogoutButton'
import LanguageSelector from './LanguageSelector'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Home, MessageCircle, Settings, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Navbar() {
  const { user } = useUser()
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState('ParrilleitorAI')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const lastScrollTop = useRef(0)
  const [navbarVisible, setNavbarVisible] = useState(true)
  const userMenuRef = useRef(null)
  
  // Cerrar menús al hacer clic fuera de ellos
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Manejar scroll para efectos visuales y ocultamiento en móvil
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.scrollY;
      
      // Aplicar efecto de fondo cuando hay scroll
      setScrolled(currentScrollTop > 10);
      
      // Auto-hide navbar on scroll down (solo en móviles)
      if (window.innerWidth < 768) {
        if (currentScrollTop > lastScrollTop.current && currentScrollTop > 100) {
          setNavbarVisible(false); // Scroll hacia abajo - ocultar
        } else {
          setNavbarVisible(true); // Scroll hacia arriba - mostrar
        }
      } else {
        setNavbarVisible(true); // En desktop siempre visible
      }
      
      lastScrollTop.current = currentScrollTop;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Establecer el título de la página basado en la ruta actual
  useEffect(() => {
    if (pathname === '/') {
      setPageTitle('ParrilleitorAI');
    } else if (pathname === '/chat') {
      setPageTitle('Chat con AI');
    } else if (pathname === '/profile') {
      setPageTitle('Mi Perfil');
    } else if (pathname === '/admin') {
      setPageTitle('Administración');
    } else {
      // Convertir path a título capitalizado
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        setPageTitle(lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1));
      }
    }
  }, [pathname]);
  
  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  
  // Lista de enlaces de navegación
  const navLinks = [
    { href: '/', label: 'Inicio', icon: <Home size={18} className="mr-2" /> },
    { href: '/chat', label: 'Chat', icon: <MessageCircle size={18} className="mr-2" /> },
    user && { href: '/profile', label: 'Perfil', icon: <User size={18} className="mr-2" /> },
  ].filter(Boolean);
  
  // Toggle del menú móvil con bloqueo de scroll
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : '';
  };
  
  // Toggle del menú de usuario
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  return (
    <>
      {/* Navbar principal con animaciones */}
      <motion.header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md',
          scrolled ? 'bg-white/90 dark:bg-gray-900/90 shadow-sm' : 'bg-transparent',
          !navbarVisible && '-translate-y-full'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className={cn(
                  "font-bold text-xl transition-colors",
                  scrolled ? 'text-primary' : 'text-white'
                )}>
                  ParrilleitorAI
                </span>
              </Link>
            </div>
            
            {/* Navegación en desktop */}
            <nav className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === link.href 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
            
            {/* Acciones en la barra (derecha) */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="hidden md:block">
                <LanguageSelector appearance="dropdown" />
              </div>

              {/* Login/Usuario */}
              <div className="relative">
                {!user ? (
                  <LoginButton />
                ) : (
                  <div ref={userMenuRef}>
                    <button
                      onClick={toggleUserMenu}
                      className="flex items-center text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                      id="user-menu-button"
                      aria-expanded={userMenuOpen}
                    >
                      {user.picture ? (
                        <img
                          className="h-8 w-8 rounded-full mr-2 object-cover"
                          src={user.picture}
                          alt={user.name || 'Avatar'}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2">
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="hidden md:block">{user.name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                      <ChevronDown size={16} className={cn(
                        "transition-transform duration-200",
                        userMenuOpen ? "rotate-180" : ""
                      )} />
                    </button>
                    
                    {/* Menú desplegable de usuario */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        >
                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <User size={16} className="mr-2" />
                            Mi Perfil
                          </Link>
                          <hr className="my-1" />
                          <div className="px-4 py-2">
                            <LogoutButton className="flex items-center w-full text-left text-sm text-red-600 hover:text-red-700">
                              <LogOut size={16} className="mr-2" />
                              Cerrar Sesión
                            </LogoutButton>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              
              {/* Botón de menú móvil */}
              <button
                className="md:hidden rounded-md p-2 ml-3 text-gray-700 hover:bg-gray-100 focus:outline-none"
                onClick={toggleMobileMenu}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Menú móvil con animaciones */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-40 md:hidden bg-gray-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMobileMenu}
          >
            <motion.div 
              className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl overflow-y-auto z-50"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-5 pb-6 px-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-primary">ParrilleitorAI</span>
                  </div>
                  <button
                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 focus:outline-none"
                    onClick={toggleMobileMenu}
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Contenido del menú móvil */}
                <div className="mt-6">
                  <nav className="grid gap-y-8">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className={cn(
                          'flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors',
                          pathname === link.href 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-gray-900 hover:bg-gray-50'
                        )}
                        onClick={toggleMobileMenu}
                      >
                        {link.icon}
                        <span className="ml-3">{link.label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
                
                {/* Mobile language selector */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Idioma</h3>
                  <LanguageSelector appearance="list" />
                </div>
                
                {/* Perfil de usuario en móvil */}
                {user && (
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <div className="flex items-center mb-4">
                      {user.picture ? (
                        <img
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                          src={user.picture}
                          alt={user.name || 'Avatar'}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-base font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                      onClick={toggleMobileMenu}
                    >
                      <User size={20} className="inline-block mr-2" />
                      Mi Perfil
                    </Link>
                    <button 
                      className="mt-2 w-full flex items-center px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md"
                      onClick={toggleMobileMenu}
                    >
                      <LogOut size={20} className="mr-2" />
                      <LogoutButton className="bg-transparent p-0 text-inherit">
                        Cerrar Sesión
                      </LogoutButton>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}