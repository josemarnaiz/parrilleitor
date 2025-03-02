import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

export default async function handler(req, res) {
  // Generar un ID único para esta solicitud para seguimiento en logs
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  console.log(`[${requestId}] Iniciando solicitud para eliminar todas las conversaciones: ${req.method}`);

  // Set CORS headers
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', 'https://parrilleitorai.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir método DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log(`[${requestId}] Obteniendo sesión de usuario`);
    const session = await getSession(req, res);

    if (!session?.user) {
      console.log(`[${requestId}] Usuario no autenticado`);
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userEmail = session.user.email;
    const roles = session.user[AUTH0_NAMESPACE] || [];
    
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(userEmail);

    console.log(`[${requestId}] Delete All API - Session user:`, {
      email: userEmail,
      roles,
      hasPremiumRole,
      isAllowedUser,
      timestamp: new Date().toISOString()
    });

    if (!hasPremiumRole && !isAllowedUser) {
      console.log(`[${requestId}] Usuario no premium intentando acceder:`, userEmail);
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    try {
      await connectDB();
      
      // Eliminar todas las conversaciones del usuario
      const result = await Conversation.deleteMany({
        userId: session.user.sub
      });
      
      console.log(`[${requestId}] Conversaciones eliminadas: ${result.deletedCount}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Todas las conversaciones eliminadas correctamente',
        count: result.deletedCount
      });
    } catch (error) {
      console.error(`[${requestId}] Error al eliminar conversaciones:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({ 
        error: 'Error al eliminar las conversaciones',
        details: error.message
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde.',
      details: error.message
    });
  }
} 