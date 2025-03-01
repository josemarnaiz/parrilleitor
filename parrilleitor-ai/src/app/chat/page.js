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
  // Nuevos estados para manejar las conversaciones y el panel lateral
  const [allConversations, setAllConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conversationSummaries, setConversationSummaries] = useState({})
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  // Nuevos estados para manejo de eliminación
  const [isDeletingConversation, setIsDeletingConversation] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState(null)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
          user: user.email,
          sub: user.sub,
          timestamp: new Date().toISOString()
        })

        const response = await fetch('/api/users/roles', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        })
        
        const data = await response.json()
        console.log('Premium verification response:', data)
        
        if (response.ok && data.user) {
          setIsPremium(data.user.isPremium)
          console.log('Premium status set:', {
            isPremium: data.user.isPremium,
            timestamp: new Date().toISOString()
          })
          
          if (data.user.isPremium) {
            loadChatHistory() // Cargar historial después de confirmar estado premium
          }
          return
        }
        
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
        }
      } finally {
        if (isMounted) {
          setIsCheckingAccess(false)
        }
      }
    }

    if (!isUserLoading && user) {
      checkPremiumStatus()
    } else if (!isUserLoading && !user) {
      setError('Necesitas iniciar sesión para acceder al chat.')
      setIsCheckingAccess(false)
    }

    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [user, isUserLoading, retryCount])

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
          // Guardar todas las conversaciones
          setAllConversations(data.conversations);
          
          // Cargar la conversación más reciente
          const latestConversation = data.conversations[0];
          setMessages(latestConversation.messages || []);
          setSelectedConversationId(latestConversation._id);
          
          // Inicializar el objeto de resúmenes con los resúmenes existentes
          const summaries = {};
          data.conversations.forEach(conv => {
            if (conv.summary) {
              summaries[conv._id] = conv.summary;
            }
          });
          setConversationSummaries(summaries);
          
          // Si la conversación más reciente no tiene resumen, generarlo
          if (!latestConversation.summary) {
            generateSummary(latestConversation._id, latestConversation.messages);
          }
          
          console.log('Conversación cargada:', latestConversation);
        } else {
          console.log('No hay conversaciones disponibles');
          setMessages([]);
          setAllConversations([]);
        }
      } else {
        console.error('Error al cargar el historial:', data.error || 'Error desconocido');
        setMessages([]);
        setAllConversations([]);
      }
    } catch (error) {
      console.error('Error al cargar el historial de chat:', error);
      setMessages([]);
      setAllConversations([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const generateSummary = async (conversationId, messagesData) => {
    try {
      setIsGeneratingSummary(true);
      
      // Solo generar resumen si hay suficientes mensajes (al menos 3)
      if (!messagesData || messagesData.length < 3) {
        console.log('No hay suficientes mensajes para generar un resumen');
        return;
      }
      
      const response = await fetch('/api/chat/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversationId, 
          messages: messagesData 
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok && data.summary) {
        // Actualizar el estado de resúmenes
        setConversationSummaries(prev => ({
          ...prev,
          [conversationId]: data.summary
        }));
        console.log('Resumen generado con éxito:', data.summary);
      } else {
        console.error('Error al generar el resumen:', data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error al generar el resumen:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const loadConversation = (conversationId) => {
    const conversation = allConversations.find(conv => conv._id === conversationId);
    if (conversation) {
      setMessages(conversation.messages || []);
      setSelectedConversationId(conversationId);
      
      // Si no hay resumen para esta conversación, generarlo
      if (!conversationSummaries[conversationId]) {
        generateSummary(conversationId, conversation.messages);
      }
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setSelectedConversationId(null);
    setInput('');
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

      if (data.success && data.conversation) {
        // Si es una conversación nueva, actualizar el ID seleccionado
        if (!selectedConversationId) {
          setSelectedConversationId(data.conversation._id);
        }
        
        // Actualizar la lista de conversaciones
        loadChatHistory();
        
        // Generar resumen si hay suficientes mensajes
        if (updatedMessages.length >= 3 && !conversationSummaries[data.conversation._id]) {
          generateSummary(data.conversation._id, updatedMessages);
        }
      }

      if (!data.success && data.message) {
        console.warn('Advertencia al guardar mensajes:', data.message);
      }
    } catch (error) {
      console.error('Error al guardar mensajes:', error);
    }
  };

  // Nueva función para eliminar una conversación individual
  const deleteConversation = async (conversationId) => {
    try {
      setIsDeletingConversation(true);
      setIsLoading(true);
      
      const response = await fetch(`/api/chat/history?conversationId=${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Actualizar el estado local eliminando la conversación borrada
        setAllConversations(prev => prev.filter(conv => conv._id !== conversationId));
        
        // Si la conversación actual es la que se eliminó, cargar otra conversación
        if (selectedConversationId === conversationId) {
          const nextConversation = allConversations.find(conv => conv._id !== conversationId);
          if (nextConversation) {
            setMessages(nextConversation.messages || []);
            setSelectedConversationId(nextConversation._id);
          } else {
            // Si no hay más conversaciones, iniciar una nueva
            startNewConversation();
          }
        }
        
        // Eliminar el resumen de la conversación
        setConversationSummaries(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
        
        setError(null);
      } else {
        console.error('Error al eliminar la conversación:', data.message || 'Error desconocido');
        setError('No se pudo eliminar la conversación. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al eliminar la conversación:', error);
      setError('Error de conexión al intentar eliminar la conversación.');
    } finally {
      setIsDeletingConversation(false);
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    }
  };

  // Nueva función para eliminar todas las conversaciones
  const deleteAllConversations = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chat/history?deleteAll=true', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Limpiar todos los estados
        setAllConversations([]);
        startNewConversation();
        setConversationSummaries({});
        setError(null);
      } else {
        console.error('Error al eliminar todas las conversaciones:', data.message || 'Error desconocido');
        setError('No se pudieron eliminar las conversaciones. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al eliminar todas las conversaciones:', error);
      setError('Error de conexión al intentar eliminar las conversaciones.');
    } finally {
      setIsLoading(false);
      setShowDeleteAllConfirm(false);
    }
  };

  // Función para confirmar la eliminación de una conversación
  const confirmDeleteConversation = (conversationId, e) => {
    e.stopPropagation(); // Evitar que se cargue la conversación al hacer clic en el botón de eliminar
    setConversationToDelete(conversationId);
    setShowDeleteConfirm(true);
  };

  // Función para cancelar la eliminación
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setShowDeleteAllConfirm(false);
    setConversationToDelete(null);
  };

  if (isUserLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white px-2 py-4 flex items-center justify-center">
        <div className="text-lg md:text-2xl font-semibold text-center">
          <div className="w-8 h-8 md:w-12 md:h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-3"></div>
          Verificando acceso...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-gradient-sport">Acceso al Chat</h2>
          <p className="text-sm md:text-base text-gray-300 mb-6">
            Para acceder al chat, necesitas iniciar sesión con tu cuenta.
          </p>
          <div className="flex flex-col space-y-3">
            <a
              href="/api/auth/login"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </a>
            <Link
              href="/"
              className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg text-center font-medium hover:bg-gray-600 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-gradient-sport">Acceso Premium Requerido</h2>
          <p className="text-sm md:text-base text-gray-300 mb-6">
            Lo sentimos, el acceso al chat está disponible solo para usuarios premium.
          </p>
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg text-center font-medium hover:bg-gray-600 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    try {
      setIsTyping(true)
      
      // Crear una copia de los mensajes actuales con el nuevo mensaje
      const updatedMessages = [
        ...messages,
        { role: 'user', content: input.trim() }
      ]
      
      // Actualizar la UI inmediatamente
      setMessages(updatedMessages)
      
      // Limpiar el input
      setInput('')
      
      // Async function to avoid blocking UI
      const sendMessageAsync = async () => {
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
      }
      
      sendMessageAsync()
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden flex flex-col">
      <div className="flex flex-col h-screen">
        {/* Cabecera */}
        <header className="bg-gray-800 p-2 md:p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-2 p-1 hover:bg-gray-700 rounded"
              aria-label={isSidebarOpen ? "Cerrar historial" : "Abrir historial"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isSidebarOpen ? "M4 6h16M4 12h8m-8 6h16" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
            <h1 className="text-gradient-sport text-base md:text-xl font-bold">ParrilleitorAI Chat</h1>
          </div>
          <Link 
            href="/" 
            className="text-xs md:text-sm text-gray-300 hover:text-white transition-colors"
          >
            Volver al inicio
          </Link>
        </header>
        
        {/* Contenedor principal con sidebar y chat */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar con conversaciones anteriores */}
          {isSidebarOpen && (
            <div className="w-64 md:w-80 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-gray-700">
                <button 
                  onClick={startNewConversation}
                  className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center text-sm font-medium transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                    />
                  </svg>
                  Nueva conversación
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-20">
                    <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                  </div>
                ) : allConversations.length === 0 ? (
                  <div className="text-center p-4 text-gray-400 text-sm">
                    No hay conversaciones guardadas
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {allConversations.map((conv) => (
                      <button
                        key={conv._id}
                        onClick={() => loadConversation(conv._id)}
                        className={`w-full p-2 rounded text-left hover:bg-gray-700 transition-colors text-sm ${
                          selectedConversationId === conv._id ? 'bg-gray-700' : ''
                        }`}
                      >
                        <div className="font-medium truncate">
                          {new Date(conv.lastUpdated || conv.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {conversationSummaries[conv._id] 
                            ? conversationSummaries[conv._id]
                            : conv.messages && conv.messages.length > 0 
                              ? conv.messages[0].content.substring(0, 40) + '...'
                              : 'Conversación vacía'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Chat principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mensajes */}
            <div className="flex-1 p-2 md:p-4 overflow-y-auto custom-scrollbar space-y-3">
              {error && (
                <div className="bg-red-500 text-white p-2 md:p-3 rounded-lg mb-3 text-xs md:text-sm max-w-full mx-auto text-center">
                  {error}
                  <button 
                    onClick={() => setError(null)} 
                    className="ml-2 font-bold hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Mostrar resumen si existe */}
              {selectedConversationId && conversationSummaries[selectedConversationId] && (
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg mb-4 text-xs md:text-sm">
                  <h3 className="font-medium text-blue-400 mb-1">Resumen de la conversación:</h3>
                  <p className="text-gray-300">{conversationSummaries[selectedConversationId]}</p>
                </div>
              )}
              
              {messages.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-gray-400 text-xs md:text-base">
                  <p className="mb-2 md:mb-3">👋 ¡Hola! Soy tu asistente de nutrición y ejercicio.</p>
                  <p>¿En qué puedo ayudarte hoy?</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 md:p-3 rounded-lg text-xs md:text-base mb-1 md:mb-2 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 ml-auto max-w-[80%] md:max-w-[75%]' 
                        : message.role === 'error'
                        ? 'bg-red-500 mr-auto max-w-[80%] md:max-w-[75%]'
                        : 'bg-gray-700 mr-auto max-w-[80%] md:max-w-[75%]'
                    }`}
                  >
                    {message.content}
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="bg-gray-700 p-2 md:p-3 rounded-lg mr-auto max-w-[80%] md:max-w-[75%] text-xs md:text-base">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              
              {/* Elemento invisible para scroll */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Formulario de entrada */}
            <div className="border-t border-gray-700 p-2 md:p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 p-2 rounded-lg bg-gray-700 text-white text-xs md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-base flex-shrink-0 font-medium"
                  disabled={isTyping}
                >
                  {isTyping ? '...' : 'Enviar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 