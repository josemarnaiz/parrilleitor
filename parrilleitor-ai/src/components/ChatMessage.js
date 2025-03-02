export default function ChatMessage({ message, isLast }) {
  // Determine if this is a user or AI message
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  
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
      </div>
    </div>
  );
} 