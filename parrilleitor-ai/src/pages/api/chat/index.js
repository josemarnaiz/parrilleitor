import { getSession } from '@auth0/nextjs-auth0';
import { AIProviderFactory } from '@/services/ai/AIProviderFactory';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { logAuth, logAuthError, logError, logInfo } from '@/config/logger';

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
  const requestId = crypto.randomUUID(); // ID único para seguir esta solicitud en los logs
  
  logInfo('Chat API request received', { 
    method: req.method,
    path: req.url,
    requestId
  });
  
  // Configurar encabezados CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    logInfo('CORS preflight request', { requestId });
    res.status(200).end();
    return;
  }

  try {
    // Obtener la sesión del usuario
    const session = await getSession(req, res);
    
    logAuth('Session obtained in chat API', session, { requestId });
    
    // Verificar que el usuario esté autenticado
    if (!session?.user) {
      logAuthError('Authentication failed - no session', null, null, { requestId });
      res.status(401).json({ error: 'No autorizado. Por favor, inicie sesión.' });
      return;
    }

    // Verificar si el usuario tiene acceso (usuario permitido o rol premium)
    const userEmail = session.user.email;
    const roles = session.user[AUTH0_NAMESPACE] || [];
    
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(userEmail);

    logAuth('Access verification in chat API', session, {
      isAllowedUser,
      hasPremiumRole,
      requestId
    });
    
    // Decisión final de acceso
    const hasAccess = isAllowedUser || hasPremiumRole;
    
    if (!hasAccess) {
      logAuthError('Premium access denied in chat API', null, session, { 
        requestId,
        userEmail,
        isAllowedUser,
        hasPremiumRole
      });
      res.status(403).json({ error: 'Se requiere una cuenta premium para usar la API de chat.' });
      return;
    }

    // Manejar solicitud según el método HTTP
    if (req.method === 'DELETE') {
      try {
        // Validar que se proporciona un ID de conversación
        const { conversationId } = req.query;
        
        if (!conversationId) {
          logError('Missing conversationId in DELETE request', null, { requestId });
          res.status(400).json({ error: 'Se requiere un ID de conversación para eliminar.' });
          return;
        }

        // Conectar a la base de datos
        const { db } = await connectDB();
        
        // Verificar que la conversación pertenece al usuario actual
        const conversation = await Conversation.findOne({ 
          _id: conversationId,
          userId: session.user.sub 
        });
        
        if (!conversation) {
          logError('Conversation not found or does not belong to user', null, { 
            requestId, 
            conversationId,
            userId: session.user.sub
          });
          res.status(404).json({ error: 'Conversación no encontrada o no pertenece a este usuario.' });
          return;
        }
        
        // Eliminar la conversación
        await Conversation.deleteOne({ _id: conversationId });
        
        logInfo('Conversation deleted successfully', { 
          requestId, 
          conversationId,
          userId: session.user.sub
        });
        
        res.status(200).json({ message: 'Conversación eliminada correctamente' });
        return;
      } catch (error) {
        logError('Error deleting conversation', error, { 
          requestId,
          method: 'DELETE'
        });
        res.status(500).json({ error: 'Error al eliminar la conversación.' });
        return;
      }
    }
    
    // Si no es DELETE, verificar que sea POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Establecer un timeout para la función completa
    const functionTimeout = setTimeout(() => {
      console.error(`[${requestId}] Timeout de función alcanzado, respondiendo con error`);
      return res.status(504).json({ 
        error: 'La solicitud ha excedido el tiempo máximo de espera',
        message: 'Por favor, intenta con un mensaje más corto o inténtalo de nuevo más tarde.'
      });
    }, 45000); // 45 segundos de timeout total

    const { message, conversationId } = req.body;
    console.log(`[${requestId}] Mensaje recibido:`, {
      messageLength: message?.length || 0,
      conversationId: conversationId || 'nueva conversación',
      preview: message ? message.substring(0, 50) + '...' : 'mensaje vacío'
    });

    if (!message) {
      console.log(`[${requestId}] Mensaje vacío recibido`);
      clearTimeout(functionTimeout);
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }

    // Limitar la longitud del mensaje para evitar timeouts
    const truncatedMessage = message.length > 1000 
      ? message.substring(0, 1000) + "... (mensaje truncado para mejorar el rendimiento)"
      : message;
    
    if (message.length > 1000) {
      console.log(`[${requestId}] Mensaje truncado de ${message.length} a 1000 caracteres`);
    }

    // PASO 1: Obtener respuesta de OpenAI primero, sin guardar nada en MongoDB
    // Preparar mensajes para OpenAI con el contexto mínimo necesario
    const messagesForAI = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: truncatedMessage }
    ];

    console.log(`[${requestId}] PASO 1: Solicitando respuesta a OpenAI`);
    let aiResponse;
    try {
      // Obtener respuesta de OpenAI
      console.log(`[${requestId}] Inicializando proveedor de IA`);
      const aiProvider = AIProviderFactory.getProvider();
      
      console.log(`[${requestId}] Enviando solicitud a OpenAI`);
      aiResponse = await aiProvider.getResponse(messagesForAI);
      
      console.log(`[${requestId}] Respuesta de OpenAI recibida:`, {
        responseLength: aiResponse?.length || 0,
        preview: aiResponse ? aiResponse.substring(0, 100) + '...' : 'respuesta vacía'
      });
      
      if (!aiResponse) {
        console.error(`[${requestId}] Respuesta de OpenAI vacía o nula`);
        throw new Error('Respuesta de OpenAI vacía o nula');
      }
    } catch (aiError) {
      console.error(`[${requestId}] Error al obtener respuesta de OpenAI:`, {
        error: aiError.message,
        stack: aiError.stack,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = "Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo con un mensaje más corto o más tarde.";
      
      clearTimeout(functionTimeout);
      return res.status(200).json({
        response: errorMessage,
        error: aiError.message,
        conversation: null
      });
    }

    // PASO 2: Solo después de tener la respuesta de OpenAI, intentamos guardar en MongoDB
    console.log(`[${requestId}] PASO 2: Guardando conversación en MongoDB`);
    let conversation = null;
    let dbError = null;

    try {
      // Intentar conectar a MongoDB
      console.log(`[${requestId}] Conectando a MongoDB`);
      await connectDB();
      console.log(`[${requestId}] Conexión a MongoDB establecida correctamente`);
      
      // Buscar o crear conversación
      if (conversationId) {
        console.log(`[${requestId}] Buscando conversación existente con ID: ${conversationId}`);
        conversation = await Conversation.findOne({
          _id: conversationId,
          userId: session.user.sub,
          isActive: true
        });
        
        if (conversation) {
          console.log(`[${requestId}] Conversación encontrada, mensajes actuales: ${conversation.messages.length}`);
        } else {
          console.log(`[${requestId}] Conversación no encontrada, creando nueva`);
        }
      } else {
        console.log(`[${requestId}] Creando nueva conversación`);
      }
      
      if (!conversation) {
        // Crear nueva conversación
        conversation = new Conversation({
          userId: session.user.sub,
          userEmail: session.user.email,
          messages: [],
          lastUpdated: new Date(),
          isActive: true
        });
        console.log(`[${requestId}] Nueva conversación creada`);
      }
      
      // Usar el nuevo método addMessages para añadir ambos mensajes a la vez
      console.log(`[${requestId}] Añadiendo mensajes a la conversación`);
      // Esto es más eficiente que hacer dos operaciones de guardado separadas
      await conversation.addMessages([
        { role: 'user', content: truncatedMessage, timestamp: new Date() },
        { role: 'assistant', content: aiResponse, timestamp: new Date() }
      ]);
      
      console.log(`[${requestId}] Conversación guardada correctamente en MongoDB, ID: ${conversation._id}`);
    } catch (error) {
      dbError = error;
      console.error(`[${requestId}] Error al guardar en MongoDB:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Crear un objeto de conversación temporal para devolver al cliente
      console.log(`[${requestId}] Creando conversación temporal debido al error de MongoDB`);
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

    // PASO 3: Devolver la respuesta al cliente, independientemente de si se guardó en MongoDB
    console.log(`[${requestId}] PASO 3: Enviando respuesta al cliente`);
    console.log(`[${requestId}] Respuesta final:`, {
      responseLength: aiResponse.length,
      preview: aiResponse.substring(0, 100) + '...',
      conversationId: conversation._id,
      dbError: dbError ? dbError.message : null
    });
    
    clearTimeout(functionTimeout);
    const response = {
      response: aiResponse,
      conversation: conversation,
      // Si hubo error de MongoDB, incluir una advertencia
      ...(dbError && {
        warning: "Se obtuvo respuesta de OpenAI pero no se pudo guardar en la base de datos. La conversación continuará pero podría no persistir.",
        dbError: dbError.message
      })
    };
    
    console.log(`[${requestId}] Solicitud completada exitosamente`);
    return res.status(200).json(response);
  } catch (error) {
    logError('Unhandled error in chat API', error, { 
      requestId,
      method: req.method 
    });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
} 