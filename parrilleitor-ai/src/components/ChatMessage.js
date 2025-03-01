export default function ChatMessage({ message, isLast }) {
  // Determine if this is a user or AI message
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  
  // Determine the appropriate styling based on message type
  const getBubbleStyle = () => {
    if (isUser) {
      return 'bg-primary/10 text-gray-800 ml-auto';
    } else if (isError) {
      return 'bg-red-100 text-red-700';
    } else {
      return 'bg-gray-100 text-gray-800';
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
    <div className={`max-w-3xl mx-auto ${isUser ? 'pl-10' : 'pr-10'}`}>
      <div className={`p-4 rounded-lg ${getBubbleStyle()}`}>
        {formatContent(message.content)}
      </div>
    </div>
  );
} 