import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

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

// Definir el esquema de mensajes y conversaciones directamente aquí para evitar problemas de importación
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'error'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Crear el modelo de Conversation
let Conversation;
try {
  // Intentar obtener el modelo existente
  Conversation = mongoose.models.Conversation;
} catch (error) {
  // Si no existe, crearlo
  Conversation = mongoose.model('Conversation', conversationSchema);
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

    // Verify premium access
    const roles = session.user[AUTH0_NAMESPACE] || [];
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(session.user.email);

    if (!hasPremiumRole && !isAllowedUser) {
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    try {
      // Conectar a MongoDB
      await connectDB();
      console.log('Conexión a MongoDB establecida para el historial de chat');
    } catch (dbError) {
      console.error('Error de conexión a MongoDB:', dbError);
      // Devolver una respuesta vacía en lugar de un error
      return res.status(200).json({ 
        conversations: [],
        message: 'No se pudo conectar a la base de datos',
        error: dbError.message
      });
    }

    if (req.method === 'GET') {
      try {
        // Asegurarse de que el modelo esté definido
        if (!Conversation) {
          Conversation = mongoose.model('Conversation', conversationSchema);
        }
        
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

        // Asegurarse de que el modelo esté definido
        if (!Conversation) {
          Conversation = mongoose.model('Conversation', conversationSchema);
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