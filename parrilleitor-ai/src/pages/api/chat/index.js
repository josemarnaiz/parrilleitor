import { getSession } from '@auth0/nextjs-auth0';
import { AIProviderFactory } from '@/services/ai/AIProviderFactory';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

const SYSTEM_PROMPT = `You are ParrilleitorAI, a friendly and professional AI assistant specialized in sports nutrition and physical exercise. Your purpose is to help users achieve their fitness and nutrition goals.

ALLOWED AREAS:
1. Sports nutrition and meal planning
2. Exercise routines and training programs
3. Basic sports supplementation
4. Muscle recovery and rest
5. Sports hydration
6. Training periodization
7. Fitness goals (fat loss, muscle gain, performance)

LANGUAGE HANDLING:
1. Detect the language of the user's input
2. CONSISTENTLY maintain that language throughout the conversation

RESPONSE GUIDELINES:
1. Be specific and practical
2. Explain the reasoning
3. Prioritize safety and well-being
4. Include relevant warnings
5. Request more information when needed

MEDICAL BOUNDARIES:
- DO NOT give medical advice
- DO NOT recommend medications
- DO NOT address injuries or rehabilitation
- For medical concerns, kindly suggest consulting a healthcare professional`;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', 'https://parrilleitorai.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Establecer un timeout para la función completa
  const functionTimeout = setTimeout(() => {
    console.error('Timeout de función alcanzado, respondiendo con error');
    return res.status(504).json({ 
      error: 'La solicitud ha excedido el tiempo máximo de espera',
      message: 'Por favor, intenta con un mensaje más corto o inténtalo de nuevo más tarde.'
    });
  }, 45000); // 45 segundos de timeout total

  try {
    const session = await getSession(req, res);

    if (!session?.user) {
      clearTimeout(functionTimeout);
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userEmail = session.user.email;
    const roles = session.user[AUTH0_NAMESPACE] || [];
    
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(userEmail);

    console.log('Chat API - Session user:', {
      email: userEmail,
      roles,
      hasPremiumRole,
      isAllowedUser,
      timestamp: new Date().toISOString()
    });

    if (!hasPremiumRole && !isAllowedUser) {
      console.log('Usuario no premium intentando acceder:', userEmail);
      clearTimeout(functionTimeout);
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    const { message, conversationId } = req.body;

    if (!message) {
      clearTimeout(functionTimeout);
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }

    // Limitar la longitud del mensaje para evitar timeouts
    const truncatedMessage = message.length > 1000 
      ? message.substring(0, 1000) + "... (mensaje truncado para mejorar el rendimiento)"
      : message;

    try {
      await connectDB();
    } catch (dbError) {
      console.error('Error al conectar a MongoDB:', dbError);
      clearTimeout(functionTimeout);
      return res.status(200).json({
        response: "Lo siento, hubo un problema al conectar con la base de datos. Tu mensaje ha sido recibido, pero no se pudo guardar. Puedes continuar la conversación.",
        error: dbError.message,
        conversation: null
      });
    }

    let conversation;
    try {
      if (conversationId) {
        conversation = await Conversation.findOne({
          _id: conversationId,
          userId: session.user.sub,
          isActive: true
        });

        if (!conversation) {
          // Si no se encuentra la conversación, crear una nueva en lugar de devolver error
          console.log('Conversación no encontrada, creando una nueva');
          conversation = new Conversation({
            userId: session.user.sub,
            userEmail: session.user.email,
            messages: [],
            lastUpdated: new Date(),
            isActive: true
          });
        }
      } else {
        conversation = new Conversation({
          userId: session.user.sub,
          userEmail: session.user.email,
          messages: [],
          lastUpdated: new Date(),
          isActive: true
        });
      }

      // Add user message
      await conversation.addMessage('user', truncatedMessage);
    } catch (convError) {
      console.error('Error al gestionar la conversación:', convError);
      clearTimeout(functionTimeout);
      return res.status(200).json({
        response: "Lo siento, hubo un problema al gestionar la conversación. Tu mensaje ha sido recibido, pero no se pudo guardar el historial completo.",
        error: convError.message,
        conversation: null
      });
    }

    // Limitar el historial de conversación para mejorar el rendimiento
    const limitedMessages = conversation.messages.slice(-10); // Usar solo los últimos 10 mensajes

    // Prepare conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...limitedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    try {
      // Get AI response
      const aiProvider = AIProviderFactory.getProvider();
      const aiResponse = await aiProvider.getResponse(messages);

      // Add AI response
      await conversation.addMessage('assistant', aiResponse);

      clearTimeout(functionTimeout);
      return res.status(200).json({
        response: aiResponse,
        conversation: conversation
      });
    } catch (error) {
      console.error('AI Provider Error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Mensaje de error amigable
      const errorMessage = "Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo con un mensaje más corto o más tarde.";
      
      // Add error message
      await conversation.addMessage('error', errorMessage);

      clearTimeout(functionTimeout);
      return res.status(200).json({
        response: errorMessage,
        error: error.message,
        conversation: conversation
      });
    }
  } catch (error) {
    console.error('Error general:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    clearTimeout(functionTimeout);
    return res.status(200).json({ 
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde.',
      details: error.message
    });
  }
} 