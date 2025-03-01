import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// URI de MongoDB hardcodeada como fallback
const MONGODB_URI_FALLBACK = 'mongodb+srv://jmam:jmamadmin@cluster0.pogiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Common headers
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

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

    // Verificar si la URI de MongoDB está configurada correctamente
    // Usar la URI del .env.local o el fallback si no está disponible
    const mongoUri = process.env.MONGODB_URI || MONGODB_URI_FALLBACK;
    
    console.log('MongoDB URI utilizada:', {
      uri: mongoUri.substring(0, mongoUri.indexOf('@') + 1) + '***', // Ocultar credenciales
      fromEnv: !!process.env.MONGODB_URI,
      usingFallback: !process.env.MONGODB_URI,
      timestamp: new Date().toISOString()
    });
    
    if (!mongoUri || (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'))) {
      console.error('MongoDB URI no válida:', mongoUri);
      // Devolver una respuesta vacía en lugar de un error
      return res.status(200).json({ 
        conversations: [],
        message: 'Base de datos no configurada correctamente'
      });
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.error('Error de conexión a MongoDB:', dbError);
      // Devolver una respuesta vacía en lugar de un error
      return res.status(200).json({ 
        conversations: [],
        message: 'No se pudo conectar a la base de datos'
      });
    }

    if (req.method === 'GET') {
      try {
        const conversations = await Conversation.find({
          userId: session.user.sub,
          isActive: true
        })
        .sort({ lastUpdated: -1 })
        .limit(10);

        return res.status(200).json({ conversations });
      } catch (findError) {
        console.error('Error al buscar conversaciones:', findError);
        return res.status(200).json({ 
          conversations: [],
          message: 'Error al recuperar conversaciones'
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

        // Buscar conversación existente o crear una nueva
        let conversation = await Conversation.findOne({
          userId: session.user.sub,
          isActive: true
        }).sort({ lastUpdated: -1 });

        if (!conversation) {
          conversation = new Conversation({
            userId: session.user.sub,
            userEmail: session.user.email,
            title: 'Nueva conversación',
            messages: messages,
            lastUpdated: new Date(),
            isActive: true
          });
        } else {
          conversation.messages = messages;
          conversation.lastUpdated = new Date();
        }

        await conversation.save();
        return res.status(200).json({ 
          success: true,
          conversation
        });
      } catch (saveError) {
        console.error('Error al guardar conversación:', saveError);
        return res.status(200).json({ 
          success: false,
          message: 'Error al guardar la conversación'
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
      message: 'Se produjo un error al procesar la solicitud'
    });
  }
} 