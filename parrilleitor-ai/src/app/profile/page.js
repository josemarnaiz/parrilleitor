'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Profile() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState(null)
  const [userStats, setUserStats] = useState({
    conversationsCount: 0,
    messagesCount: 0,
    joinDate: null
  })

  // Prevenir problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar estado premium
  useEffect(() => {
    let isMounted = true

    const checkUserStatus = async () => {
      try {
        if (!user) return
        
        setIsCheckingStatus(true)
        setError(null)

        // Verificar estado premium
        const response = await fetch('/api/users/roles', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        })
        
        const data = await response.json()
        
        if (response.ok && data.user && isMounted) {
          setIsPremium(data.user.isPremium)
          
          // Obtener estadísticas de usuario - se podría implementar esta API en el futuro
          // Por ahora usamos datos simulados
          setUserStats({
            conversationsCount: 5,
            messagesCount: 37,
            joinDate: new Date(user.updated_at || Date.now()).toLocaleDateString()
          })
        } else {
          throw new Error(data.error || 'Error al verificar el estado del usuario')
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error en perfil:', err)
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setIsCheckingStatus(false)
        }
      }
    }

    if (user) {
      checkUserStatus()
    }

    return () => {
      isMounted = false
    }
  }, [user])

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!isLoading && !user && mounted) {
      router.push('/')
    }
  }, [isLoading, user, router, mounted])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null // Esto no se debería mostrar ya que redirigimos, pero por si acaso
  }

  return (
    <div className="container max-w-xl mx-auto px-4 py-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
          <div className="flex items-center">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name || 'Usuario'} 
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="ml-4">
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="opacity-90">{user.email}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPremium ? 'bg-yellow-400 text-yellow-800' : 'bg-white/20 text-white'}`}>
                  {isPremium ? 'Premium' : 'Usuario Básico'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Estadísticas de uso</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{userStats.conversationsCount}</div>
              <div className="text-sm text-gray-600">Conversaciones</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{userStats.messagesCount}</div>
              <div className="text-sm text-gray-600">Mensajes</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-sm font-medium text-gray-800">Miembro desde</div>
              <div className="text-sm text-gray-600">{userStats.joinDate}</div>
            </div>
          </div>
          
          <h2 className="text-lg font-semibold mb-4">Acciones</h2>
          
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium">Información de la cuenta</div>
                <div className="text-sm text-gray-600">Ver y editar tu información personal</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium">Cambiar contraseña</div>
                <div className="text-sm text-gray-600">Actualiza tu contraseña de acceso</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <Link href="/api/auth/logout" className="flex items-center p-3 bg-red-50 rounded-lg text-red-700 hover:bg-red-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm9 2a1 1 0 00-1-1H5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V7.414l-2-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium">Cerrar sesión</div>
                <div className="text-sm text-red-600">Salir de tu cuenta</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Sección de planes - se muestra solo para usuarios no premium */}
      {!isPremium && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Mejora tu plan</h2>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg mb-4 border border-primary/20">
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="font-bold text-primary">Plan Premium</h3>
            </div>
            <p className="text-gray-600 mb-3">Desbloquea todas las funciones avanzadas y disfruta de una experiencia sin límites.</p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Conversaciones ilimitadas
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Planes de nutrición personalizados
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Rutinas de ejercicio avanzadas
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Soporte prioritario
              </li>
            </ul>
            <button
              className="w-full bg-primary text-white font-medium py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Actualizar a Premium
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 