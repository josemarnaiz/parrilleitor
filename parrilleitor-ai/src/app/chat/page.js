'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'

export default function Chat() {
  const { user, isLoading: isUserLoading } = useUser()
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function checkPremiumStatus() {
      try {
        if (!isMounted) return
        setIsCheckingAccess(true)
        setError(null)

        if (!user) {
          console.log('No user found, waiting for user data...')
          return // En lugar de redirigir, simplemente esperamos
        }

        const response = await fetch('/api/users/roles', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Authorization': `Bearer ${user.accessToken || ''}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error checking premium status:', {
            status: response.status,
            error: errorData,
            retryCount
          })
          
          // Solo reintentamos si el error es "retryable"
          if (response.status === 401 && errorData.retryable && retryCount < 3) {
            console.log('Session check failed, retrying...', { retryCount })
            if (isMounted) {
              setRetryCount(prev => prev + 1)
            }
            return
          }
          
          // Solo redirigimos al login si explícitamente no es "retryable"
          if (response.status === 401 && !errorData.retryable) {
            console.log('Session invalid, redirecting to login')
            router.push('/api/auth/login')
            return
          }
          
          throw new Error(errorData.error || 'Error al verificar el estado premium')
        }

        const data = await response.json()
        console.log('Premium status check:', {
          email: user.email,
          isPremium: data.user.isPremium,
          retryCount
        })

        if (!data.user.isPremium) {
          console.log('User not premium, redirecting to unauthorized')
          router.push('/unauthorized')
          return
        }

        if (isMounted) {
          setIsPremium(true)
          setRetryCount(0)
        }
      } catch (err) {
        console.error('Error in premium check:', {
          error: err,
          retryCount
        })
        if (isMounted) {
          setError(err.message)
          // Solo redirigimos después de agotar los reintentos
          if (retryCount >= 3) {
            router.push('/unauthorized')
          }
        }
      } finally {
        if (isMounted) {
          setIsCheckingAccess(false)
        }
      }
    }

    const timeoutId = setTimeout(() => {
      if (!isUserLoading) {
        checkPremiumStatus()
      }
    }, Math.min(retryCount * 1000, 3000)) // Máximo 3 segundos de delay

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [user, isUserLoading, router, retryCount])

  if (isUserLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-2xl">
          {retryCount > 0 ? `Verificando acceso (intento ${retryCount}/3)...` : 'Cargando...'}
        </div>
      </div>
    )
  }

  if (!user || !isPremium) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage = { role: 'user', content: input }
    setMessages([...messages, newMessage])
    setInput('')
    setIsTyping(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Authorization': `Bearer ${user.accessToken || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Chat API error:', errorData)
        
        // Solo redirigimos al login si es un error de autenticación no recuperable
        if (response.status === 401 && !errorData.retryable) {
          router.push('/api/auth/login')
          return
        }
        
        throw new Error(errorData.error || 'Error en la respuesta del servidor')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (error) {
      console.error('Error in chat:', error)
      setError(error.message)
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.' 
      }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 min-h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {error && (
              <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
                {error}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 ml-auto max-w-[80%]' 
                    : message.role === 'error'
                    ? 'bg-red-500 mr-auto max-w-[80%]'
                    : 'bg-gray-700 mr-auto max-w-[80%]'
                }`}
              >
                {message.content}
              </div>
            ))}
            {isTyping && (
              <div className="bg-gray-700 p-4 rounded-lg mr-auto">
                Escribiendo...
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              disabled={isTyping}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 