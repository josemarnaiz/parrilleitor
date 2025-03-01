import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import getMongoDBClient from '@/lib/mongodb';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// Common headers
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Nombre de la colección en MongoDB
const COLLECTION_NAME = 'conversations';

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

    // Verify premium access
    const roles = session.user[AUTH0_NAMESPACE] || [];
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(session.user.email);

    if (!hasPremiumRole && !isAllowedUser) {
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    // Obtener el cliente de MongoDB
    const mongoClient = getMongoDBClient();
    
    // Verificar la conexión a MongoDB
    try {
      const isConnected = await mongoClient.ping();
      if (!isConnected) {
        console.error('No se pudo conectar a MongoDB');
        return res.status(200).json({ 
          conversations: [],
          message: 'Error de conexión a MongoDB',
          error: 'No se pudo establecer conexión con la base de datos. Verifica que la IP del servidor esté permitida en MongoDB Atlas.'
        });
      }
    } catch (pingError) {
      console.error('Error al verificar la conexión a MongoDB:', pingError);
      return res.status(200).json({ 
        conversations: [],
        message: 'Error de conexión a MongoDB',
        error: pingError.message,
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

        return res.status(200).json({ conversations });
      } catch (findError) {
        console.error('Error al buscar conversaciones:', findError);
        return res.status(200).json({ 
          conversations: [],
          message: 'Error al recuperar conversaciones',
          error: findError.message
        });
      }
    }

    if (req.method === 'POST') {
      try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
          return res.status(200).json({ 
            success: false,
            message: 'Formato de mensajes inválido'
          });
        }

        // Buscar conversación existente
        const existingConversation = await mongoClient.findOne(
          COLLECTION_NAME,
          {
            userId: session.user.sub,
            isActive: true
          }
        );

        if (!existingConversation) {
          // Crear nueva conversación
          const newConversation = {
            userId: session.user.sub,
            userEmail: session.user.email,
            messages: messages,
            lastUpdated: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await mongoClient.insertOne(COLLECTION_NAME, newConversation);
          
          // Añadir el ID al objeto de conversación para devolverlo
          newConversation._id = result.insertedId;
          
          return res.status(200).json({ 
            success: true,
            conversation: newConversation
          });
        } else {
          // Actualizar conversación existente
          const updatedConversation = {
            ...existingConversation,
            messages: messages,
            lastUpdated: new Date(),
            updatedAt: new Date()
          };

          await mongoClient.replaceOne(
            COLLECTION_NAME,
            { _id: existingConversation._id },
            updatedConversation
          );

          return res.status(200).json({ 
            success: true,
            conversation: updatedConversation
          });
        }
      } catch (saveError) {
        console.error('Error al guardar conversación:', saveError);
        return res.status(200).json({ 
          success: false,
          message: 'Error al guardar la conversación',
          error: saveError.message
        });
      }
    }

    // Method not allowed
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error general:', error);
    return res.status(200).json({ 
      conversations: [],
      error: 'Error interno del servidor',
      message: 'Se produjo un error al procesar la solicitud',
      details: error.message
    });
  }
} 