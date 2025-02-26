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

  useEffect(() => {
    async function checkPremiumStatus() {
      try {
        setIsCheckingAccess(true)
        setError(null)

        if (!user) {
          console.log('No user found, redirecting to login')
          router.push('/api/auth/login')
          return
        }

        const response = await fetch('/api/users/roles', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error checking premium status:', errorData)
          
          if (response.status === 401) {
            console.log('Session expired, redirecting to login')
            router.push('/api/auth/login')
            return
          }
          
          throw new Error(errorData.error || 'Error al verificar el estado premium')
        }

        const data = await response.json()
        console.log('Premium status check:', {
          email: user.email,
          isPremium: data.user.isPremium
        })

        if (!data.user.isPremium) {
          console.log('User not premium, redirecting')
          router.push('/unauthorized')
          return
        }

        setIsPremium(true)
      } catch (err) {
        console.error('Error in premium check:', err)
        setError(err.message)
        router.push('/unauthorized')
      } finally {
        setIsCheckingAccess(false)
      }
    }

    if (!isUserLoading) {
      checkPremiumStatus()
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-2xl">Cargando...</div>
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
          'Cache-Control': 'no-store, max-age=0'
        },
        credentials: 'include',
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Chat API error:', errorData)
        
        if (response.status === 401) {
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