import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function ConversationList({ 
  conversations, 
  selectedConversationId, 
  conversationSummaries, 
  loadConversation,
  isLoading,
  onDeleteConversation,
  onDeleteAllConversations 
}) {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  
  // Group conversations by date for better organization
  const groupedConversations = groupByDate(conversations);
  
  // Function to group conversations by date
  function groupByDate(conversations) {
    if (!conversations || conversations.length === 0) return {};
    
    const grouped = {};
    
    // Get today and yesterday dates for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Group conversations
    conversations.forEach(conv => {
      const date = new Date(conv.lastUpdated || conv.createdAt);
      date.setHours(0, 0, 0, 0);
      
      let dateKey;
      
      // Check if the conversation is from today, yesterday, or earlier
      if (date.getTime() === today.getTime()) {
        dateKey = 'Hoy';
      } else if (date.getTime() === yesterday.getTime()) {
        dateKey = 'Ayer';
      } else {
        // Format date as DD/MM/YYYY for older conversations
        dateKey = date.toLocaleDateString();
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(conv);
    });
    
    return grouped;
  }
  
  // Format time from date (WhatsApp style)
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  // Get summary or first message preview
  function getConversationPreview(conversation) {
    if (conversationSummaries[conversation._id]) {
      return conversationSummaries[conversation._id];
    }
    
    if (conversation.messages && conversation.messages.length > 0) {
      // Get first user message if possible
      const firstUserMsg = conversation.messages.find(msg => msg.role === 'user');
      if (firstUserMsg) {
        return firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '');
      }
      
      // Fallback to first message
      return conversation.messages[0].content.substring(0, 40) + (conversation.messages[0].content.length > 40 ? '...' : '');
    }
    
    return 'Conversación vacía';
  }
  
  // Generate initials or icon for avatar
  function getConversationIcon(conversation) {
    // Get first letter of first word and first letter of second word
    const preview = getConversationPreview(conversation);
    const words = preview.split(' ');
    
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      return words[0][0].toUpperCase();
    } else {
      return 'AI';
    }
  }
  
  // Handle delete conversation
  const handleDelete = (e, conversationId) => {
    e.stopPropagation(); // Prevent triggering the conversation selection
    if (onDeleteConversation) {
      onDeleteConversation(conversationId);
    }
  };
  
  // Handle delete all conversations
  const handleDeleteAll = () => {
    if (onDeleteAllConversations) {
      onDeleteAllConversations();
    }
    setShowDeleteOptions(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-20">
        <div className="w-6 h-6 border-t-2 border-[#25d366] rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500 text-sm">
        No hay conversaciones guardadas
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Delete options */}
      {showDeleteOptions && (
        <div className="px-3 py-2 border-b border-gray-200 bg-[#f6f6f6]">
          <div className="p-2 bg-white rounded-md shadow-sm">
            <button 
              onClick={handleDeleteAll}
              className="text-xs text-red-600 hover:text-red-800 w-full text-left py-1 px-2 rounded hover:bg-gray-100"
            >
              Borrar todas las conversaciones
            </button>
            <div className="text-xs text-gray-500 mt-1 px-2">
              O haz clic en el icono de papelera junto a cada conversación para borrarla individualmente.
            </div>
          </div>
        </div>
      )}
      
      {/* Toggle delete options button */}
      <div className="px-3 py-2 border-b border-gray-200 bg-[#f6f6f6]">
        <button 
          onClick={() => setShowDeleteOptions(!showDeleteOptions)}
          className={`text-xs ${showDeleteOptions ? 'text-red-600' : 'text-gray-600'} hover:text-red-600 flex items-center px-2 py-1 rounded ${showDeleteOptions ? 'bg-gray-100' : ''}`}
        >
          <Trash2 size={14} className="mr-1" />
          {showDeleteOptions ? 'Ocultar opciones' : 'Gestionar conversaciones'}
        </button>
      </div>
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedConversations).map(([dateKey, convs]) => (
          <div key={dateKey} className="mb-0.5">
            <div className="px-3 py-1 text-xs font-medium text-gray-600 bg-[#f6f6f6]">
              {dateKey}
            </div>
            
            {convs.map((conv) => (
              <div 
                key={conv._id}
                className={`border-b border-gray-100 ${
                  selectedConversationId === conv._id ? 'bg-[#ebebeb]' : 'hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => loadConversation(conv._id)}
                  className="text-left w-full py-2 px-3 flex items-center"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-[#dfe5e7] rounded-full mr-3 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-[#00a884] flex items-center justify-center text-white font-medium">
                      {getConversationIcon(conv)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="font-medium text-gray-900 truncate">
                        Conversación {conversationSummaries[conv._id] ? '' : `#${conv._id.substr(-4)}`}
                      </div>
                      <div className="text-xs text-gray-500 ml-2">
                        {formatTime(conv.lastUpdated || conv.createdAt)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 truncate pr-1">
                      {getConversationPreview(conv)}
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  {showDeleteOptions && (
                    <button 
                      onClick={(e) => handleDelete(e, conv._id)}
                      className="ml-2 text-gray-400 hover:text-red-600 p-1"
                      title="Borrar conversación"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 