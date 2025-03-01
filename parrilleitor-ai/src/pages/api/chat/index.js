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

    // Intentar conectar a MongoDB pero no fallar si hay error
    let dbConnected = false;
    try {
      await connectDB();
      dbConnected = true;
      console.log('Conexión a MongoDB establecida correctamente');
    } catch (dbError) {
      console.error('Error al conectar a MongoDB:', dbError);
      // No fallamos aquí, continuamos con la petición a OpenAI
      console.log('Continuando sin conexión a MongoDB, se intentará guardar después de obtener respuesta de OpenAI');
    }

    // Cargar conversación existente si hay un ID
    let conversation = null;
    let existingMessages = [];
    
    if (dbConnected && conversationId) {
      try {
        conversation = await Conversation.findOne({
          _id: conversationId,
          userId: session.user.sub,
          isActive: true
        });
        
        if (conversation) {
          existingMessages = [...conversation.messages];
          console.log(`Conversación existente cargada, ID: ${conversationId}, mensajes: ${existingMessages.length}`);
        } else {
          console.log('Conversación no encontrada, se creará una nueva después de obtener respuesta de OpenAI');
        }
      } catch (findError) {
        console.error('Error al buscar conversación existente:', findError);
        // No fallamos aquí, continuamos con la petición a OpenAI
      }
    }

    // Preparar mensajes para OpenAI
    // Si tenemos conversación existente, usamos sus mensajes, si no, solo el mensaje actual
    const messagesForAI = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];
    
    if (existingMessages.length > 0) {
      // Limitar a los últimos 10 mensajes para mejorar rendimiento
      const limitedExistingMessages = existingMessages.slice(-9); // Dejamos espacio para el nuevo mensaje
      messagesForAI.push(...limitedExistingMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }
    
    // Añadir el mensaje actual del usuario
    messagesForAI.push({ role: 'user', content: truncatedMessage });

    let aiResponse;
    try {
      // Obtener respuesta de OpenAI
      console.log('Solicitando respuesta a OpenAI...');
      const aiProvider = AIProviderFactory.getProvider();
      aiResponse = await aiProvider.getResponse(messagesForAI);
      console.log('Respuesta de OpenAI recibida correctamente');
    } catch (aiError) {
      console.error('Error al obtener respuesta de OpenAI:', aiError);
      
      const errorMessage = "Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo con un mensaje más corto o más tarde.";
      
      clearTimeout(functionTimeout);
      return res.status(200).json({
        response: errorMessage,
        error: aiError.message,
        conversation: conversation // Devolvemos la conversación sin modificar
      });
    }

    // Solo después de recibir respuesta de OpenAI, guardamos en MongoDB
    if (dbConnected) {
      try {
        // Si no teníamos conversación o no se encontró, creamos una nueva
        if (!conversation) {
          conversation = new Conversation({
            userId: session.user.sub,
            userEmail: session.user.email,
            messages: [],
            lastUpdated: new Date(),
            isActive: true
          });
        }

        // Añadir mensaje del usuario
        await conversation.addMessage('user', truncatedMessage);
        
        // Añadir respuesta de OpenAI
        await conversation.addMessage('assistant', aiResponse);
        
        console.log('Conversación guardada correctamente en MongoDB');
      } catch (saveError) {
        console.error('Error al guardar conversación en MongoDB:', saveError);
        
        // Creamos un objeto de conversación temporal para devolver al cliente
        if (!conversation) {
          conversation = {
            _id: 'temp_' + Date.now(),
            userId: session.user.sub,
            userEmail: session.user.email,
            messages: [
              { role: 'user', content: truncatedMessage, timestamp: new Date() },
              { role: 'assistant', content: aiResponse, timestamp: new Date() }
            ],
            lastUpdated: new Date(),
            isActive: true,
            _tempId: true // Marcamos como temporal
          };
        }
        
        clearTimeout(functionTimeout);
        return res.status(200).json({
          response: aiResponse,
          conversation: conversation,
          warning: "Se obtuvo respuesta de OpenAI pero no se pudo guardar en la base de datos. La conversación continuará pero podría no persistir."
        });
      }
    } else {
      // Si no pudimos conectar a MongoDB, creamos un objeto de conversación temporal
      conversation = {
        _id: 'temp_' + Date.now(),
        userId: session.user.sub,
        userEmail: session.user.email,
        messages: [
          { role: 'user', content: truncatedMessage, timestamp: new Date() },
          { role: 'assistant', content: aiResponse, timestamp: new Date() }
        ],
        lastUpdated: new Date(),
        isActive: true,
        _tempId: true // Marcamos como temporal
      };
      
      console.log('Devolviendo conversación temporal sin guardar en MongoDB');
    }

    clearTimeout(functionTimeout);
    return res.status(200).json({
      response: aiResponse,
      conversation: conversation
    });
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