import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import { hasPremiumAccess } from '@/config/auth0Config';
import { MongoClient } from 'mongodb';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// Common headers
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DATABASE;
const COLLECTION_NAME = 'conversations';

// MongoDB client
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    console.error('Error de configuración: No se ha definido MONGODB_URI en las variables de entorno');
    throw new Error('La configuración de la base de datos es incorrecta. Contacta con el administrador.');
  }

  if (!MONGODB_DB) {
    console.error('Error de configuración: No se ha definido MONGODB_DATABASE en las variables de entorno');
    throw new Error('La configuración de la base de datos es incorrecta. Contacta con el administrador.');
  }

  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    console.error('Error de configuración: Formato de MONGODB_URI incorrecto');
    throw new Error('El formato de la URI de MongoDB es incorrecto. Debe comenzar con "mongodb://" o "mongodb+srv://"');
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    await client.connect();
    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    throw new Error('No se pudo conectar a la base de datos. Verifica la conexión y las credenciales.');
  }
}

// Función para manejar errores de forma consistente
function handleError(res, error, defaultMessage = 'Error interno del servidor') {
  console.error('Error en API de historial:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  return res.status(200).json({
    success: false,
    error: error.message || defaultMessage,
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

  try {
    const session = await getSession(req, res);

    if (!session?.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Log completo de la sesión para debugging
    console.log('Session Debug:', {
      accessToken: session.accessToken ? 'present' : 'missing',
      user: {
        ...session.user,
        accessToken: session.user.accessToken ? 'present' : 'missing',
      },
      sessionId: session.sessionId,
      timestamp: new Date().toISOString()
    });

    // Verify premium access
    const hasPremiumFromClaims = hasPremiumAccess(session);
    const isAllowedUser = isInAllowedList(session.user.email);

    console.log('Premium Access Check:', {
      hasPremiumFromClaims,
      isAllowedUser,
      email: session.user.email,
      sessionKeys: Object.keys(session),
      userKeys: Object.keys(session.user),
      isPremiumInUser: session.user.isPremium,
      premiumVerifiedAt: session.user.premiumVerifiedAt
    });

    if (!hasPremiumFromClaims && !isAllowedUser) {
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    // Connect to MongoDB
    let { db } = await connectToDatabase();
    
    if (req.method === 'GET') {
      try {
        const conversations = await db
          .collection(COLLECTION_NAME)
          .find({
            userId: session.user.sub,
            isActive: true
          })
          .sort({ lastUpdated: -1 })
          .limit(10)
          .toArray();

        return res.status(200).json({ 
          success: true,
          conversations 
        });
      } catch (findError) {
        return handleError(res, findError, 'Error al recuperar conversaciones');
      }
    }

    if (req.method === 'POST') {
      try {
        const { messages, summary } = req.body;

        if (!messages || !Array.isArray(messages)) {
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
          existingConversation = await db
            .collection(COLLECTION_NAME)
            .findOne({
              userId: session.user.sub,
              isActive: true
            });
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
            result = await db
              .collection(COLLECTION_NAME)
              .insertOne(newConversation);
            
            // Si hay un error de timeout, crear una respuesta simulada
            if (result.error === 'timeout') {
              console.warn('Timeout al insertar conversación, devolviendo respuesta simulada');
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
            
            return res.status(200).json({ 
              success: true,
              conversation: newConversation
            });
          } catch (insertError) {
            console.error('Error al insertar nueva conversación:', insertError);
            
            // Devolver una respuesta simulada para que el cliente pueda continuar
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
            result = await db
              .collection(COLLECTION_NAME)
              .replaceOne(
                { _id: existingConversation._id },
                updatedConversation
              );
            
            // Si hay un error de timeout, devolver la conversación actualizada de todos modos
            if (result.error === 'timeout') {
              console.warn('Timeout al actualizar conversación, devolviendo respuesta simulada');
              return res.status(200).json({ 
                success: true,
                conversation: updatedConversation,
                warning: 'Los cambios se guardarán en un próximo intento'
              });
            }
            
            return res.status(200).json({ 
              success: true,
              conversation: updatedConversation
            });
          } catch (updateError) {
            console.error('Error al actualizar conversación existente:', updateError);
            
            // Devolver la conversación actualizada de todos modos para que el cliente pueda continuar
            return res.status(200).json({ 
              success: true,
              conversation: updatedConversation,
              warning: 'No se pudieron guardar los cambios en la base de datos',
              error: updateError.message
            });
          }
        }
      } catch (saveError) {
        return handleError(res, saveError, 'Error al guardar la conversación');
      }
    }

    // Nuevo método DELETE para borrar conversaciones
    if (req.method === 'DELETE') {
      try {
        const { conversationId, deleteAll } = req.query;

        // Opción 1: Borrar todas las conversaciones del usuario
        if (deleteAll === 'true') {
          const result = await db
            .collection(COLLECTION_NAME)
            .deleteMany({ userId: session.user.sub });

          return res.status(200).json({
            success: true,
            message: 'Todas las conversaciones han sido eliminadas',
            count: result.deletedCount || 0
          });
        }
        
        // Opción 2: Borrar una conversación específica
        else if (conversationId) {
          try {
            const objectId = db.ObjectId(conversationId);
            const result = await db
              .collection(COLLECTION_NAME)
              .deleteOne({ 
                _id: objectId,
                userId: session.user.sub 
              });

            if (result.deletedCount === 0) {
              return res.status(404).json({
                success: false,
                message: 'No se encontró la conversación o no tienes permiso para eliminarla'
              });
            }

            return res.status(200).json({
              success: true,
              message: 'Conversación eliminada correctamente'
            });
          } catch (idError) {
            return res.status(400).json({
              success: false,
              message: 'ID de conversación inválido',
              error: idError.message
            });
          }
        }
        
        // Si no se proporcionó ninguna opción válida
        else {
          return res.status(400).json({
            success: false,
            message: 'Se debe especificar conversationId o deleteAll=true'
          });
        }
      } catch (deleteError) {
        return handleError(res, deleteError, 'Error al eliminar las conversaciones');
      }
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    return handleError(res, error);
  }
} 