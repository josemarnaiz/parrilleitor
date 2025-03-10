'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConversationList from '@/components/ConversationList'
import ChatMessage from '@/components/ChatMessage'
import LoginButton from '../../components/LoginButton'

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
  // Estados para manejar las conversaciones y el panel lateral
  const [allConversations, setAllConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conversationSummaries, setConversationSummaries] = useState({})
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  // Estados para manejo de eliminación
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
          } else {
            // Redirigir a usuarios no premium a la página de unauthorized
            console.log('User does not have premium access, redirecting to unauthorized')
            router.push('/unauthorized')
            return
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
      // Redirigir a usuarios no autenticados a la página principal
      router.push('/')
    }

    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [user, isUserLoading, retryCount, router])

  const loadChatHistory = async (skipSettingMessages = false) => {
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
          
          // Solo actualizar mensajes si no estamos en medio de una conversación
          // o si no se solicita explícitamente omitir esta parte
          if (!skipSettingMessages && (!selectedConversationId || !messages.length)) {
            // Cargar la conversación más reciente
            const latestConversation = data.conversations[0];
            setMessages(latestConversation.messages || []);
            setSelectedConversationId(latestConversation._id);
          }
          
          // Inicializar el objeto de resúmenes con los resúmenes existentes
          const summaries = {};
          data.conversations.forEach(conv => {
            if (conv.summary) {
              summaries[conv._id] = conv.summary;
            }
          });
          setConversationSummaries(summaries);
          
          // Si la conversación más reciente no tiene resumen, generarlo
          const latestConversation = data.conversations[0];
          if (!latestConversation.summary) {
            generateSummary(latestConversation._id, latestConversation.messages);
          }
          
          console.log('Conversaciones cargadas, conversaciones totales:', data.conversations.length);
        } else {
          console.log('No hay conversaciones disponibles');
          
          // Solo limpiar mensajes si no estamos explícitamente evitando esto
          if (!skipSettingMessages) {
            setMessages([]);
          }
          setAllConversations([]);
        }
      } else {
        console.error('Error al cargar el historial:', data.error || 'Error desconocido');
        
        // Solo limpiar mensajes si no estamos explícitamente evitando esto
        if (!skipSettingMessages) {
          setMessages([]);
        }
        setAllConversations([]);
      }
    } catch (error) {
      console.error('Error al cargar el historial de chat:', error);
      
      // Solo limpiar mensajes si no estamos explícitamente evitando esto
      if (!skipSettingMessages) {
        setMessages([]);
      }
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
    // Verificar que no estamos cargando la misma conversación que ya está seleccionada
    if (selectedConversationId === conversationId) {
      console.log('La conversación ya está cargada:', conversationId);
      return;
    }
    
    const conversation = allConversations.find(conv => conv._id === conversationId);
    if (conversation) {
      // Limpiar mensajes actuales y establecer los de la conversación seleccionada
      setMessages([]); // Primero limpiar para evitar parpadeos/duplicados
      
      // Timeout mínimo para permitir que el estado se actualice
      setTimeout(() => {
        setMessages(conversation.messages || []);
        setSelectedConversationId(conversationId);
        
        // Si no hay resumen para esta conversación, generarlo
        if (!conversationSummaries[conversationId]) {
          generateSummary(conversationId, conversation.messages);
        }
      }, 10);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setSelectedConversationId(null);
    setInput('');
    
    // No se necesita guardar una conversación vacía, se creará cuando se envíe el primer mensaje
    console.log('Nueva conversación iniciada');
  };

  const deleteConversation = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      setIsDeletingConversation(true);
      
      const response = await fetch(`/api/chat?conversationId=${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        console.log('Conversación eliminada con éxito:', conversationId);
        
        // Actualizar la lista de conversaciones localmente
        const updatedConversations = allConversations.filter(conv => conv._id !== conversationId);
        setAllConversations(updatedConversations);
        
        // Si la conversación eliminada era la seleccionada, cargar otra o limpiar
        if (selectedConversationId === conversationId) {
          if (updatedConversations.length > 0) {
            // Cargar la primera conversación disponible
            const nextConversation = updatedConversations[0];
            setMessages(nextConversation.messages || []);
            setSelectedConversationId(nextConversation._id);
          } else {
            // No hay más conversaciones, limpiar
            setMessages([]);
            setSelectedConversationId(null);
          }
        }
      } else {
        const data = await response.json();
        console.error('Error al eliminar la conversación:', data.error);
        setError(`Error al eliminar: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar la conversación:', error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setIsDeletingConversation(false);
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
      
      // Recargar el historial completo para asegurar sincronización, pero sin actualizar los mensajes actuales
      loadChatHistory(true);
    }
  };

  const deleteAllConversations = async () => {
    try {
      setIsDeletingConversation(true);
      
      const response = await fetch('/api/chat/all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Todas las conversaciones eliminadas con éxito:', data);
        
        // Limpiar todo el estado
        setAllConversations([]);
        setMessages([]);
        setSelectedConversationId(null);
        setConversationSummaries({});
        setShowDeleteAllConfirm(false);
      } else {
        console.error('Error al eliminar todas las conversaciones:', data.error);
        setError(`Error al eliminar: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar todas las conversaciones:', error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setIsDeletingConversation(false);
      setShowDeleteAllConfirm(false);
    }
  };

  const confirmDeleteConversation = (conversationId, e) => {
    e.stopPropagation(); // Evitar que se active loadConversation
    setConversationToDelete(conversationId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setShowDeleteAllConfirm(false);
    setConversationToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isTyping) return;
    
    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    // Actualizar UI inmediatamente con el mensaje del usuario
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    
    try {
      // No guardamos los mensajes aquí, solo enviar al API directamente
      console.log('Enviando mensaje al API con conversationId:', selectedConversationId);
          
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: selectedConversationId,
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      console.log('Respuesta recibida del API:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en la respuesta del asistente');
      }
      
      // Añadir respuesta al chat
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      console.log('Añadiendo mensaje del asistente:', assistantMessage);
      
      // Crear una nueva lista de mensajes con el mensaje del usuario y la respuesta
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);
      
      // Si se creó una nueva conversación, actualizar el ID
      if (data.conversation && data.conversation._id && !selectedConversationId) {
        console.log('Actualizando ID de conversación:', data.conversation._id);
        setSelectedConversationId(data.conversation._id);
      }
      
      // La conversación ya está guardada por el backend
      
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
      
      // Mostrar mensaje de error en el chat
      const errorMessage = {
        role: 'error',
        content: `Error: ${error.message}. Por favor, intenta de nuevo.`,
        timestamp: new Date(),
      };
      
      setMessages([...updatedMessages, errorMessage]);
      setError(error.message);
    } finally {
      setIsTyping(false);
      
      // Actualizar la lista de conversaciones después de completar, pero sin modificar los mensajes
      loadChatHistory(true);
    }
  };

  // Loading state
  if (isUserLoading || isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  // Ensure user is logged in
  if (!user && !isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">Necesitas iniciar sesión</h1>
        <p className="mb-6 text-gray-600">Para utilizar el chat, debes iniciar sesión primero</p>
        <LoginButton 
          className="btn btn-primary"
        >
          Iniciar Sesión
        </LoginButton>
        <Link 
          href="/" 
          className="mt-4 text-primary hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} w-72 border-r border-gray-200 flex-col h-full overflow-hidden bg-white shadow-sm`}>
        <div className="py-3 px-4 border-b border-gray-200 flex items-center justify-between bg-primary text-white">
          <div className="flex items-center">
            <span className="font-medium">ParrilleitorAI</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-3">
          <button 
            onClick={startNewConversation}
            className="flex items-center justify-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors shadow-sm border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva conversación
          </button>
        </div>
        
        {/* History list using component */}
        <ConversationList 
          conversations={allConversations}
          selectedConversationId={selectedConversationId}
          conversationSummaries={conversationSummaries}
          loadConversation={loadConversation}
          isLoading={isLoadingHistory}
          onDeleteConversation={deleteConversation}
          onDeleteAllConversations={deleteAllConversations}
        />
      </aside>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shadow-sm">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="text-xl font-medium text-primary">
            {!isSidebarOpen ? 'ParrilleitorAI' : ''}
          </div>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </header>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm max-w-3xl mx-auto shadow-sm">
              {error}
              <button 
                onClick={() => setError(null)} 
                className="ml-2 font-bold hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl">¿En qué puedo ayudarte?</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  message={message} 
                  isLast={index === messages.length - 1}
                />
              ))}
              
              {isTyping && (
                <div className="max-w-3xl mx-auto ml-auto max-w-xs md:max-w-md">
                  <div className="p-3 rounded-lg bg-primary/10 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white shadow-inner">
          <form onSubmit={handleSubmit} className="flex items-center max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta lo que quieras"
              className="flex-1 py-3 px-4 bg-gray-100 rounded-l-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-gray-800 border-0"
            />
            <button
              type="submit"
              className="py-3 px-4 bg-primary text-white rounded-r-full hover:bg-primary-dark disabled:opacity-50 flex items-center"
              disabled={isTyping || !input.trim()}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 