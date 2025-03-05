'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from '@/components/ProfileForm'

export default function ProfilePage() {
  const { user, isLoading: isUserLoading } = useUser()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar perfil del usuario
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          if (response.status === 404) {
            // No hay perfil aún, esto es normal para usuarios nuevos
            setProfile(null)
            setIsLoading(false)
            return
          }
          throw new Error('Error al cargar el perfil')
        }
        
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadProfile()
    }
  }, [user])

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('/api/profile', {
        method: profile ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar el perfil')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      
      // Mostrar mensaje de éxito
      alert('Perfil guardado correctamente')
    } catch (err) {
      throw new Error(err.message || 'Error al guardar el perfil')
    }
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso No Autorizado</h1>
          <p className="text-gray-600">Por favor, inicia sesión para acceder a tu perfil.</p>
          <a
            href="/api/auth/login"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu Perfil</h1>
              
              <ProfileForm
                initialData={profile}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 