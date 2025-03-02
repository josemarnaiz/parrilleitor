export default function ChatMessage({ message, isLast }) {
  // Determine if this is a user or AI message
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  
  // Determine the appropriate styling based on message type
  const getBubbleStyle = () => {
    if (isUser) {
      return 'bg-primary text-white rounded-tr-lg rounded-tl-lg rounded-bl-lg';
    } else if (isError) {
      return 'bg-red-100 text-red-700 rounded-tr-lg rounded-tl-lg rounded-br-lg';
    } else {
      return 'bg-white border border-gray-200 shadow-sm text-gray-800 rounded-tr-lg rounded-tl-lg rounded-br-lg';
    }
  };
  
  // Format message content to handle newlines properly
  const formatContent = (content) => {
    if (!content) return '';
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };
  
  return (
    <div className={`max-w-3xl mx-auto ${isUser ? 'flex justify-end' : 'flex justify-start'}`}>
      <div className={`p-4 max-w-xs md:max-w-md lg:max-w-lg ${getBubbleStyle()} ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        {!isUser && !isError && (
          <div className="flex items-center mb-1">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
              <span className="text-xs font-semibold text-primary">AI</span>
            </div>
            <span className="text-xs font-medium text-gray-500">ParrilleitorAI</span>
          </div>
        )}
        <div className={`${!isUser && !isError ? 'pt-1' : ''}`}>
          {formatContent(message.content)}
        </div>
        {message.timestamp && (
          <div className="mt-2 text-xs text-right opacity-70">
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
} 