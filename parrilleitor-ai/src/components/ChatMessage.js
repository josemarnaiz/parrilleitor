export default function ChatMessage({ message, isLast }) {
  // Determine if this is a user or AI message
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };
  
  // Determine the appropriate styling based on message type (WhatsApp style)
  const getBubbleStyle = () => {
    if (isUser) {
      return 'bg-[#dcf8c6] text-gray-800 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl';
    } else if (isError) {
      return 'bg-red-100 text-red-700 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl';
    } else {
      return 'bg-white text-gray-800 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl';
    }
  };
  
  // Format message content to handle newlines properly
  const formatContent = (content) => {
    if (!content) return '';
    return content.split('\n').map((line, i) => (
      <span key={i} className="text-sm">
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };
  
  return (
    <div className={`w-full px-1 py-1 ${isUser ? 'flex justify-end' : 'flex justify-start'}`}>
      {/* Avatar for assistant (only shown for assistant messages) */}
      {!isUser && !isError && (
        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xs font-bold">
            AI
          </div>
        </div>
      )}
      
      {/* Message bubble */}
      <div className={`p-2.5 max-w-xs md:max-w-md ${getBubbleStyle()} shadow-sm relative`}>
        {/* Username for assistant (only shown for assistant messages) */}
        {!isUser && !isError && (
          <div className="text-xs font-medium text-primary mb-1">
            ParrilleitorAI
          </div>
        )}
        
        <div>
          {formatContent(message.content)}
        </div>
        
        {/* Timestamp */}
        {message.timestamp && (
          <div className="text-[10px] text-gray-500 opacity-70 text-right mt-1 min-w-[40px]">
            {formatTimestamp(message.timestamp)}
            
            {/* Read status for user messages (WhatsApp style) */}
            {isUser && (
              <span className="ml-1 text-[9px] text-blue-500">
                ✓✓
              </span>
            )}
          </div>
        )}
        
        {/* Tail for chat bubble (WhatsApp style) */}
        {!isUser && !isError && (
          <div className="absolute top-0 left-[-8px] w-4 h-4 overflow-hidden">
            <div className="absolute rotate-45 bg-white w-3 h-3 transform origin-bottom-right translate-x-1/2 translate-y-1/2"></div>
          </div>
        )}
        {isUser && (
          <div className="absolute top-0 right-[-8px] w-4 h-4 overflow-hidden">
            <div className="absolute rotate-45 bg-[#dcf8c6] w-3 h-3 transform origin-bottom-left translate-x-[-50%] translate-y-1/2"></div>
          </div>
        )}
      </div>
    </div>
  );
} 