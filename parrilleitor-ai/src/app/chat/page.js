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
  };

  const saveMessages = async (updatedMessages) => {
    try {
      setIsLoading(true);
      
      // Ensure we have messages to save
      if (!updatedMessages || updatedMessages.length === 0) {
        console.error('No hay mensajes para guardar');
        setError('No hay mensajes para guardar');
        return false;
      }
      
      // Extract the last user message if available
      const lastUserMessage = updatedMessages.filter(msg => msg.role === 'user').pop();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastUserMessage ? lastUserMessage.content : '',
          messages: updatedMessages,
          conversationId: selectedConversationId,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Mensajes guardados con éxito');
        // Si es una nueva conversación, establecer el ID de la conversación recién creada
        if (!selectedConversationId && data.conversationId) {
          setSelectedConversationId(data.conversationId);
        }
        
        // Actualizar la lista de conversaciones
        loadChatHistory();
        
        // Si hay suficientes mensajes, generar un resumen
        if (updatedMessages.length >= 3) {
          generateSummary(data.conversationId || selectedConversationId, updatedMessages);
        }
        
        return true;
      } else {
        throw new Error(data.error || 'Error al guardar los mensajes');
      }
    } catch (error) {
      console.error('Error al guardar los mensajes:', error);
      setError(`Error al guardar: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      setIsDeletingConversation(true);
      setError(null); // Limpiar errores previos
      
      if (!conversationId) {
        throw new Error('ID de conversación no válido');
      }
      
      const response = await fetch(`/api/chat?conversationId=${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: AbortSignal.timeout(8000) // 8 segundos de timeout
      });

      const data = await response.json();

      if (response.ok) {
        // Eliminar la conversación de allConversations
        setAllConversations(prev => prev.filter(conv => conv._id !== conversationId));
        
        // Si la conversación eliminada es la seleccionada actualmente
        if (selectedConversationId === conversationId) {
          // Cargar la primera conversación si hay alguna, o crear una nueva
          if (allConversations.length > 1) {
            const nextConversation = allConversations.find(conv => conv._id !== conversationId);
            if (nextConversation) {
              loadConversation(nextConversation._id);
            } else {
              startNewConversation();
            }
          } else {
            startNewConversation();
          }
        }
        
        console.log('Conversación eliminada con éxito');
        return true;
      } else {
        console.error('Error en la respuesta del servidor:', data);
        throw new Error(data.error || 'Error al eliminar la conversación');
      }
    } catch (error) {
      console.error('Error al eliminar la conversación:', error);
      
      // Mensaje de error más amigable para el usuario
      const errorMsg = error.name === 'AbortError' 
        ? 'La operación tomó demasiado tiempo. Por favor, intenta nuevamente.' 
        : `Error al eliminar la conversación: ${error.message}`;
      
      setError(errorMsg);
      return false;
    } finally {
      setIsDeletingConversation(false);
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    }
  };

  const deleteAllConversations = async () => {
    try {
      setIsDeletingConversation(true);
      setError(null); // Limpiar errores previos
      
      const response = await fetch('/api/chat/all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        // Añadir timeout más largo
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      });

      const data = await response.json();

      if (response.ok) {
        // Limpiar las conversaciones y mensajes
        setAllConversations([]);
        startNewConversation();
        
        console.log('Todas las conversaciones eliminadas con éxito');
        return true;
      } else {
        console.error('Error en la respuesta del servidor:', data);
        throw new Error(data.error || 'Error al eliminar las conversaciones');
      }
    } catch (error) {
      console.error('Error al eliminar todas las conversaciones:', error);
      
      // Mensaje de error más amigable para el usuario
      const errorMsg = error.name === 'AbortError' 
        ? 'La operación tomó demasiado tiempo. Por favor, intenta nuevamente.' 
        : `Error al eliminar conversaciones: ${error.message}`;
      
      setError(errorMsg);
      return false;
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

  const confirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete);
    }
  };
  
  const confirmDeleteAll = () => {
    deleteAllConversations();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isTyping) return;
    
    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    
    try {
      // Guardar el mensaje del usuario
      const saved = await saveMessages(updatedMessages);
      
      if (!saved) {
        throw new Error('Error al guardar el mensaje');
      }
      
      // Simular envío al servicio de AI y respuesta
      const sendMessageAsync = async () => {
        try {
          console.log('Enviando mensaje al API with conversationId:', selectedConversationId);
          
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
          
          const newMessages = [...updatedMessages, assistantMessage];
          setMessages(newMessages);
          
          // Si se creó una nueva conversación, actualizar el ID
          if (data.conversation && data.conversation._id && !selectedConversationId) {
            console.log('Actualizando ID de conversación:', data.conversation._id);
            setSelectedConversationId(data.conversation._id);
          }
          
          // Guardar la respuesta
          await saveMessages(newMessages);
          
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
        }
      };
      
      sendMessageAsync();
      
    } catch (error) {
      console.error('Error en el envío del mensaje:', error);
      setIsTyping(false);
      setError(error.message);
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
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar (Conversaciones) */}
      <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} w-80 border-r border-gray-200 flex-col h-full overflow-hidden bg-white shadow-sm`}>
        {/* Sidebar Header */}
        <div className="py-3 px-4 bg-[#075e54] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <h1 className="font-medium text-lg">ParrilleitorAI</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={startNewConversation}
              className="text-white/90 hover:text-white transition-colors"
              title="Nueva conversación"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-white/90 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search conversations */}
        <div className="p-2 bg-[#f6f6f6]">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Buscar conversación"
              className="w-full py-1.5 pl-8 pr-3 rounded-full bg-white text-sm focus:outline-none border border-gray-200"
            />
            <svg className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
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
        {/* Chat Header */}
        <header className="h-16 border-b border-gray-200 flex items-center px-4 bg-[#075e54] text-white shadow-sm">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-white/90 hover:text-white mr-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <span className="text-[#075e54] font-bold">AI</span>
            </div>
            <div>
              <h2 className="font-medium">ParrilleitorAI</h2>
              {isTyping && <p className="text-xs text-gray-100">escribiendo...</p>}
            </div>
          </div>
        </header>
        
        {/* Messages Container */}
        <div 
          className="flex-1 overflow-y-auto p-3 bg-[#e5ddd5]" 
          style={{ 
            backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be8c74.png')", 
            backgroundRepeat: 'repeat' 
          }}
        >
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
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center mb-4 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-center font-medium text-gray-700">¡Bienvenido al Chat!</p>
              <p className="text-sm text-center mt-2 max-w-xs text-gray-600">
                Escribe un mensaje para comenzar una nueva conversación.
              </p>
            </div>
          ) : (
            <div className="space-y-1 pb-2">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  message={message} 
                  isLast={index === messages.length - 1}
                />
              ))}
              
              {isTyping && (
                <div className="w-full px-1 py-1 flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xs font-bold">
                      AI
                    </div>
                  </div>
                  <div className="p-3 max-w-xs md:max-w-md bg-white text-gray-800 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area (WhatsApp style) */}
        <div className="py-2 px-4 bg-[#f0f0f0]">
          <form onSubmit={handleSubmit} className="flex items-center relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje"
              className="flex-1 py-2 pl-4 pr-10 rounded-full bg-white text-gray-800 focus:outline-none border-0 shadow-sm"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`absolute right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                input.trim() && !isTyping ? 'bg-[#25d366] text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>
      
      {/* Delete conversation confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">¿Eliminar esta conversación?</h3>
            <p className="text-gray-600 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete all conversations confirmation dialog */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">¿Eliminar todas las conversaciones?</h3>
            <p className="text-gray-600 mb-6">Esta acción no se puede deshacer y eliminará todo el historial de chat.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteAll}
                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
              >
                Eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 