import { useState } from 'react';

export default function ConversationList({ 
  conversations, 
  selectedConversationId, 
  conversationSummaries, 
  loadConversation,
  isLoading
}) {
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
  
  // Format time from date
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-20">
        <div className="w-6 h-6 border-t-2 border-primary rounded-full animate-spin"></div>
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
    <div className="flex-1 overflow-y-auto">
      {Object.entries(groupedConversations).map(([dateKey, convs]) => (
        <div key={dateKey} className="mb-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-500">
            {dateKey}
          </div>
          
          {convs.map((conv) => (
            <button
              key={conv._id}
              onClick={() => loadConversation(conv._id)}
              className={`w-full py-3 px-3 text-left hover:bg-gray-200 transition-colors ${
                selectedConversationId === conv._id ? 'bg-gray-200' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="max-w-[85%]">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {getConversationPreview(conv)}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatTime(conv.lastUpdated || conv.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
} 