'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const messagesEndRef = useRef(null)

  // Función para hacer scroll al fondo cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll automático cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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
            console.log('User not premium, showing message instead of redirecting')
            // En lugar de redirigir, mostramos un mensaje
            if (isMounted) {
              setError('Se requiere una cuenta premium para acceder al chat. Por favor, contacta al administrador.')
              setIsCheckingAccess(false)
            }
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
    } else if (!isUserLoading && !user) {
      // Si no hay usuario y no está cargando, mostramos un mensaje
      setError('Necesitas iniciar sesión para acceder al chat.')
      setIsCheckingAccess(false)
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
      setIsLoadingHistory(true);
      const response = await fetch('/api/chat/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Chat history response:', data);

      if (response.ok) {
        if (data.conversations && data.conversations.length > 0) {
          // Usar la conversación más reciente
          const latestConversation = data.conversations[0];
          setMessages(latestConversation.messages || []);
          console.log('Conversación cargada:', latestConversation);
        } else {
          console.log('No hay conversaciones disponibles');
          // No mostrar error al usuario, simplemente iniciar con mensajes vacíos
          setMessages([]);
        }
      } else {
        console.error('Error al cargar el historial:', data.error || 'Error desconocido');
        // No mostrar error al usuario, simplemente iniciar con mensajes vacíos
        setMessages([]);
      }
    } catch (error) {
      console.error('Error al cargar el historial de chat:', error);
      // No mostrar error al usuario, simplemente iniciar con mensajes vacíos
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessages = async (updatedMessages) => {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Respuesta al guardar mensajes:', data);

      if (!data.success && data.message) {
        console.warn('Advertencia al guardar mensajes:', data.message);
      }
    } catch (error) {
      console.error('Error al guardar mensajes:', error);
      // No mostrar error al usuario, continuar con la conversación
    }
  };

  if (isUserLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white px-3 py-6 flex items-center justify-center">
        <div className="text-xl md:text-2xl font-semibold text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          {retryCount > 0 ? `Verificando acceso (intento ${retryCount}/3)...` : 'Cargando...'}
        </div>
      </div>
    )
  }

  if (!user || !isPremium) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-5 md:p-8 max-w-md w-full text-center shadow-lg">
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-gradient-sport">Acceso al Chat</h1>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-sm md:text-base">
              {error}
            </div>
          )}
          
          {!user && (
            <>
              <p className="mb-6 text-sm md:text-base">Para acceder al chat, necesitas iniciar sesión con tu cuenta.</p>
              <Link 
                href="/api/auth/login" 
                className="btn-sport px-5 py-2 text-sm md:text-base"
              >
                Iniciar Sesión
              </Link>
            </>
          )}
          
          {user && !isPremium && (
            <>
              <p className="mb-6 text-sm md:text-base">Tu cuenta no tiene acceso premium. Por favor, contacta al administrador para obtener acceso.</p>
              <Link 
                href="/" 
                className="btn-sport px-5 py-2 text-sm md:text-base"
              >
                Volver al Inicio
              </Link>
            </>
          )}
        </div>
      </div>
    )
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
      // Crear un controlador de aborto para el timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000); // 60 segundos de timeout
      
      console.log('Enviando mensaje al servidor:', {
        messageLength: input.length,
        preview: input.substring(0, 50) + (input.length > 50 ? '...' : '')
      });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Authorization': `Bearer ${user.accessToken || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ message: input }),
        signal: controller.signal
      });
      
      // Limpiar el timeout una vez que se recibe la respuesta
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Chat API error:', errorData)
        
        if (response.status === 401) {
          throw new Error('Error de sesión. Por favor, recarga la página.')
        }
        
        throw new Error(errorData.error || 'Error en la respuesta del servidor')
      }

      const data = await response.json()
      console.log('Respuesta de la API de chat:', data)
      
      // Verificar si hay una respuesta válida
      if (!data.response) {
        console.error('Respuesta de API sin mensaje:', data)
        throw new Error('No se recibió respuesta del servidor')
      }
      
      const finalMessages = [...updatedMessages, { role: 'assistant', content: data.response }]
      setMessages(finalMessages)
      
      // Si hay una advertencia, mostrarla como error pero no interrumpir el flujo
      if (data.warning) {
        console.warn('Advertencia del servidor:', data.warning)
        setError(`Nota: ${data.warning}`)
      }
      
      saveMessages(finalMessages)
    } catch (error) {
      console.error('Error in chat:', error)
      
      // Determinar el mensaje de error apropiado para el usuario
      let errorMessage = 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.'
      
      if (error.name === 'AbortError') {
        console.error('La solicitud fue abortada por timeout');
        errorMessage = 'La solicitud ha tardado demasiado tiempo. Por favor, intenta con un mensaje más corto o inténtalo más tarde.'
      } else if (error.message.includes('timeout') || error.message.includes('tiempo')) {
        errorMessage = 'La solicitud ha tardado demasiado tiempo. Por favor, intenta con un mensaje más corto o inténtalo más tarde.'
      } else if (error.message.includes('No se recibió respuesta')) {
        errorMessage = 'No se pudo obtener una respuesta del asistente. Por favor, intenta de nuevo.'
      } else if (error.message.includes('sesión')) {
        errorMessage = 'Tu sesión ha expirado. Por favor, recarga la página para iniciar sesión de nuevo.'
      }
      
      setError(error.message)
      const errorMessages = [...updatedMessages, { 
        role: 'error', 
        content: errorMessage
      }]
      setMessages(errorMessages)
      
      // Intentar guardar el mensaje de error en el historial
      try {
        saveMessages(errorMessages)
      } catch (saveError) {
        console.error('Error al guardar mensaje de error:', saveError)
      }
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col p-3 md:p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
          {/* Encabezado del chat */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 md:p-4">
            <h1 className="text-lg md:text-xl font-bold text-gradient-sport">ParrilleitorAI Chat</h1>
            <p className="text-xs md:text-sm text-gray-400">Tu asistente personal de nutrición y ejercicio</p>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
            {error && (
              <div className="bg-red-500 text-white p-3 rounded-lg mb-3 text-sm">
                {error}
                <button 
                  className="ml-2 text-white underline text-xs"
                  onClick={() => setError(null)}
                >
                  Cerrar
                </button>
              </div>
            )}
            
            {isLoadingHistory ? (
              <div className="text-center py-4 text-sm md:text-base">
                <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                Cargando historial...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm md:text-base">
                <p className="mb-3">👋 ¡Hola! Soy tu asistente de nutrición y ejercicio.</p>
                <p>¿En qué puedo ayudarte hoy?</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm md:text-base ${
                    message.role === 'user' 
                      ? 'bg-blue-600 ml-auto max-w-[85%] md:max-w-[75%]' 
                      : message.role === 'error'
                      ? 'bg-red-500 mr-auto max-w-[85%] md:max-w-[75%]'
                      : 'bg-gray-700 mr-auto max-w-[85%] md:max-w-[75%]'
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="bg-gray-700 p-3 rounded-lg mr-auto max-w-[85%] md:max-w-[75%] text-sm md:text-base">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            
            {/* Elemento invisible para scroll */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Formulario de entrada */}
          <div className="border-t border-gray-700 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 p-2 rounded-lg bg-gray-700 text-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 md:px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base flex-shrink-0"
                disabled={isTyping}
              >
                {isTyping ? '...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 