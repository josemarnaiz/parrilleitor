import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import getMongoDBClient from '@/lib/mongodb';
import { hasPremiumAccess } from '@/config/auth0Config';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// Common headers
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Nombre de la colección en MongoDB
const COLLECTION_NAME = 'conversations';

// Función para manejar errores de forma consistente
function handleError(res, error, defaultMessage = 'Error interno del servidor') {
  console.error('Error en API de historial:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Determinar el tipo de error para dar una respuesta más específica
  let errorMessage = defaultMessage;
  let errorDetails = error.message;
  
  if (error.message.includes('buffering timed out') || error.message.includes('timed out')) {
    errorMessage = 'La operación en la base de datos tardó demasiado tiempo. Por favor, inténtalo de nuevo.';
    errorDetails = 'Timeout en operación de MongoDB. Esto puede ocurrir si la conexión es lenta o si hay problemas de red.';
  } else if (error.message.includes('connection') || error.message.includes('network')) {
    errorMessage = 'Problema de conexión con la base de datos. Por favor, inténtalo de nuevo más tarde.';
    errorDetails = 'Error de conexión a MongoDB. Verifica la conectividad de red y la configuración de acceso.';
  }
  
  // Siempre devolver 200 para evitar errores en el cliente, pero con información del error
  return res.status(200).json({
    success: false,
    error: errorMessage,
    details: errorDetails,
    timestamp: new Date().toISOString()
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(commonHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Establecer un timeout para la función completa
  const functionTimeout = setTimeout(() => {
    console.error('Timeout de función alcanzado, respondiendo con error');
    return res.status(200).json({ 
      success: false,
      error: 'La solicitud ha excedido el tiempo máximo de espera',
      message: 'Por favor, inténtalo de nuevo más tarde.',
      timestamp: new Date().toISOString()
    });
  }, 25000); // 25 segundos de timeout total

  try {
    const session = await getSession(req, res);

    if (!session?.user) {
      clearTimeout(functionTimeout);
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verify premium access using the same method as the rest of the app
    const hasPremiumFromClaims = hasPremiumAccess(session);
    const isAllowedUser = isInAllowedList(session.user.email);

    console.log('Premium Access Check:', {
      hasPremiumFromClaims,
      isAllowedUser,
      email: session.user.email,
      sessionKeys: Object.keys(session),
      userKeys: Object.keys(session.user)
    });

    if (!hasPremiumFromClaims && !isAllowedUser) {
      clearTimeout(functionTimeout);
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    // Obtener el cliente de MongoDB
    const mongoClient = getMongoDBClient();
    
    // Verificar la conexión a MongoDB
    try {
      const isConnected = await mongoClient.getConnection();
      if (!isConnected?.db) {
        console.error('No se pudo conectar a MongoDB');
        clearTimeout(functionTimeout);
        return res.status(200).json({ 
          success: false,
          conversations: [],
          message: 'Error de conexión a MongoDB',
          error: 'No se pudo establecer conexión con la base de datos.',
          details: 'Verifica la configuración de MongoDB y los permisos de acceso.'
        });
      }
    } catch (connectionError) {
      console.error('Error al verificar la conexión a MongoDB:', connectionError);
      clearTimeout(functionTimeout);
      return res.status(200).json({ 
        success: false,
        conversations: [],
        message: 'Error de conexión a MongoDB',
        error: connectionError.message,
        details: 'Es posible que necesites configurar el acceso desde cualquier IP (0.0.0.0/0) en MongoDB Atlas Network Access.'
      });
    }
    
    if (req.method === 'GET') {
      try {
        // Buscar conversaciones usando MongoDB
        const conversations = await mongoClient.find(
          COLLECTION_NAME,
          {
            userId: session.user.sub,
            isActive: true
          },
          {
            sort: { lastUpdated: -1 },
            limit: 10
          }
        );

        clearTimeout(functionTimeout);
        return res.status(200).json({ 
          success: true,
          conversations 
        });
      } catch (findError) {
        clearTimeout(functionTimeout);
        return handleError(res, findError, 'Error al recuperar conversaciones');
      }
    }

    if (req.method === 'POST') {
      try {
        const { messages, summary } = req.body;

        if (!messages || !Array.isArray(messages)) {
          clearTimeout(functionTimeout);
          return res.status(200).json({ 
            success: false,
            message: 'Formato de mensajes inválido'
          });
        }

        // Limitar el número de mensajes para evitar problemas de rendimiento
        const limitedMessages = messages.length > 20 ? messages.slice(-20) : messages;

        // Buscar conversación existente
        let existingConversation = null;
        try {
          existingConversation = await mongoClient.findOne(
            COLLECTION_NAME,
            {
              userId: session.user.sub,
              isActive: true
            }
          );
        } catch (findError) {
          console.warn('Error al buscar conversación existente, continuando con creación de nueva:', findError.message);
          // Continuar con la creación de una nueva conversación
        }

        let result;
        if (!existingConversation) {
          // Crear nueva conversación
          const newConversation = {
            userId: session.user.sub,
            userEmail: session.user.email,
            messages: limitedMessages,
            lastUpdated: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Agregar el resumen si se proporciona
          if (summary) {
            newConversation.summary = summary;
          }

          try {
            result = await mongoClient.insertOne(COLLECTION_NAME, newConversation);
            
            // Si hay un error de timeout, crear una respuesta simulada
            if (result.error === 'timeout') {
              console.warn('Timeout al insertar conversación, devolviendo respuesta simulada');
              clearTimeout(functionTimeout);
              return res.status(200).json({ 
                success: true,
                conversation: {
                  ...newConversation,
                  _id: 'temp_' + Date.now(),
                  _tempId: true
                },
                warning: 'La conversación se guardará en un próximo intento'
              });
            }
            
            // Añadir el ID al objeto de conversación para devolverlo
            newConversation._id = result.insertedId;
            
            clearTimeout(functionTimeout);
            return res.status(200).json({ 
              success: true,
              conversation: newConversation
            });
          } catch (insertError) {
            console.error('Error al insertar nueva conversación:', insertError);
            
            // Devolver una respuesta simulada para que el cliente pueda continuar
            clearTimeout(functionTimeout);
            return res.status(200).json({ 
              success: true,
              conversation: {
                ...newConversation,
                _id: 'temp_' + Date.now(),
                _tempId: true
              },
              warning: 'No se pudo guardar la conversación en la base de datos',
              error: insertError.message
            });
          }
        } else {
          // Actualizar conversación existente
          const updatedConversation = {
            ...existingConversation,
            messages: limitedMessages,
            lastUpdated: new Date(),
            updatedAt: new Date()
          };
          
          // Actualizar el resumen si se proporciona
          if (summary) {
            updatedConversation.summary = summary;
          }

          try {
            result = await mongoClient.replaceOne(
              COLLECTION_NAME,
              { _id: existingConversation._id },
              updatedConversation
            );
            
            // Si hay un error de timeout, devolver la conversación actualizada de todos modos
            if (result.error === 'timeout') {
              console.warn('Timeout al actualizar conversación, devolviendo respuesta simulada');
              clearTimeout(functionTimeout);
              return res.status(200).json({ 
                success: true,
                conversation: updatedConversation,
                warning: 'Los cambios se guardarán en un próximo intento'
              });
            }
            
            clearTimeout(functionTimeout);
            return res.status(200).json({ 
              success: true,
              conversation: updatedConversation
            });
          } catch (updateError) {
            console.error('Error al actualizar conversación existente:', updateError);
            
            // Devolver la conversación actualizada de todos modos para que el cliente pueda continuar
            clearTimeout(functionTimeout);
            return res.status(200).json({ 
              success: true,
              conversation: updatedConversation,
              warning: 'No se pudieron guardar los cambios en la base de datos',
              error: updateError.message
            });
          }
        }
      } catch (saveError) {
        clearTimeout(functionTimeout);
        return handleError(res, saveError, 'Error al guardar la conversación');
      }
    }

    // Nuevo método DELETE para borrar conversaciones
    if (req.method === 'DELETE') {
      try {
        const { conversationId, deleteAll } = req.query;

        // Opción 1: Borrar todas las conversaciones del usuario
        if (deleteAll === 'true') {
          const result = await mongoClient.deleteMany(
            COLLECTION_NAME,
            { userId: session.user.sub }
          );

          clearTimeout(functionTimeout);
          return res.status(200).json({
            success: true,
            message: 'Todas las conversaciones han sido eliminadas',
            count: result.deletedCount || 0
          });
        }
        
        // Opción 2: Borrar una conversación específica
        else if (conversationId) {
          try {
            const objectId = mongoClient.ObjectId(conversationId);
            const result = await mongoClient.deleteOne(
              COLLECTION_NAME,
              { 
                _id: objectId,
                userId: session.user.sub 
              }
            );

            if (result.deletedCount === 0) {
              clearTimeout(functionTimeout);
              return res.status(404).json({
                success: false,
                message: 'No se encontró la conversación o no tienes permiso para eliminarla'
              });
            }

            clearTimeout(functionTimeout);
            return res.status(200).json({
              success: true,
              message: 'Conversación eliminada correctamente'
            });
          } catch (idError) {
            clearTimeout(functionTimeout);
            return res.status(400).json({
              success: false,
              message: 'ID de conversación inválido',
              error: idError.message
            });
          }
        }
        
        // Si no se proporcionó ninguna opción válida
        else {
          clearTimeout(functionTimeout);
          return res.status(400).json({
            success: false,
            message: 'Se debe especificar conversationId o deleteAll=true'
          });
        }
      } catch (deleteError) {
        clearTimeout(functionTimeout);
        return handleError(res, deleteError, 'Error al eliminar las conversaciones');
      }
    }

    // Method not allowed
    clearTimeout(functionTimeout);
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    clearTimeout(functionTimeout);
    return handleError(res, error, 'Error interno del servidor');
  }
} 