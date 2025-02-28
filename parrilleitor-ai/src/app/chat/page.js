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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  useEffect(() => {
    let isMounted = true
    let retryTimeout = null

    async function checkPremiumStatus() {
      try {
        if (!isMounted) return
        setIsCheckingAccess(true)
        setError(null)

        if (!user || isUserLoading) {
          console.log('Waiting for user data...', {
            hasUser: !!user,
            isLoading: isUserLoading,
            timestamp: new Date().toISOString()
          })
          return
        }

        console.log('Checking premium status for:', {
          email: user.email,
          retryCount,
          timestamp: new Date().toISOString()
        })

        const response = await fetch('/api/users/roles', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Authorization': `Bearer ${user.accessToken || ''}`
          }
        })
        
        // Siempre procesamos la respuesta, incluso si no es 200
        const data = await response.json()
        
        console.log('Premium status response:', {
          status: response.status,
          data,
          retryCount,
          timestamp: new Date().toISOString()
        })
        
        // Si tenemos datos de usuario, los usamos
        if (data.user) {
          if (data.user.isTemporary) {
            console.log('Temporary user session detected')
            // Si es una sesión temporal, no redirigimos, solo mostramos un mensaje
            if (isMounted) {
              setError('Sesión temporal. Por favor recarga la página si necesitas acceso completo.')
              setIsCheckingAccess(false)
            }
            return
          }
          
          if (!data.user.isPremium) {
            console.log('User not premium, redirecting to unauthorized')
            router.push('/unauthorized')
            return
          }
          
          if (isMounted) {
            setIsPremium(true)
            setRetryCount(0)
            loadChatHistory() // Load chat history after confirming premium status
          }
          return
        }
        
        // Si hay un error en la respuesta pero no es crítico
        if (!response.ok && retryCount < 3) {
          if (isMounted) {
            setRetryCount(prev => prev + 1)
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.min(Math.pow(2, retryCount) * 1000, 4000)
            console.log(`Retrying in ${delay}ms...`)
            retryTimeout = setTimeout(checkPremiumStatus, delay)
          }
          return
        }
        
        // Si llegamos aquí, hay un problema con la sesión
        throw new Error(data.error || 'Error checking premium status')
      } catch (err) {
        console.error('Premium check error:', {
          error: err.message,
          stack: err.stack,
          retryCount,
          timestamp: new Date().toISOString()
        })
        if (isMounted) {
          setError(err.message)
          // No redirigimos automáticamente, solo mostramos el error
        }
      } finally {
        if (isMounted) {
          setIsCheckingAccess(false)
        }
      }
    }

    // Solo iniciamos la verificación si tenemos datos de usuario
    if (!isUserLoading && user) {
      checkPremiumStatus()
    }

    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [user, isUserLoading, router, retryCount])

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const response = await fetch('/api/chat/history', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Authorization': `Bearer ${user.accessToken || ''}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar el historial')
      }

      const data = await response.json()
      if (data.conversations && data.conversations.length > 0) {
        setMessages(data.conversations[0].messages || [])
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      setError('Error al cargar el historial de chat')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const saveMessages = async (newMessages) => {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Authorization': `Bearer ${user.accessToken || ''}`
        },
        body: JSON.stringify({ messages: newMessages })
      })

      if (!response.ok) {
        throw new Error('Error al guardar la conversación')
      }
    } catch (error) {
      console.error('Error saving chat history:', error)
      setError('Error al guardar la conversación')
    }
  }

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
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
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
        
        if (response.status === 401) {
          throw new Error('Error de sesión. Por favor, recarga la página.')
        }
        
        throw new Error(errorData.error || 'Error en la respuesta del servidor')
      }

      const data = await response.json()
      const finalMessages = [...updatedMessages, { role: 'assistant', content: data.message }]
      setMessages(finalMessages)
      saveMessages(finalMessages)
    } catch (error) {
      console.error('Error in chat:', error)
      setError(error.message)
      const errorMessages = [...updatedMessages, { 
        role: 'error', 
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.' 
      }]
      setMessages(errorMessages)
      saveMessages(errorMessages)
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
            {isLoadingHistory ? (
              <div className="text-center py-4">
                Cargando historial...
              </div>
            ) : (
              messages.map((message, index) => (
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
              ))
            )}
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