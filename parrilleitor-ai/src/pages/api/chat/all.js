import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import { hasPremiumAccess } from '@/config/auth0Config';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

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
    // Verificar premium usando el método actualizado
    const hasPremiumFromClaims = hasPremiumAccess(session);
    const isAllowedUser = isInAllowedList(userEmail);

    console.log(`[${requestId}] Delete All API - Session user:`, {
      email: userEmail,
      isPremium: hasPremiumFromClaims,
      isAllowedUser,
      timestamp: new Date().toISOString()
    });

    if (!hasPremiumFromClaims && !isAllowedUser) {
      console.log(`[${requestId}] Usuario no premium intentando acceder:`, userEmail);
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    try {
      // Establecer un timeout para la función completa
      const functionTimeout = setTimeout(() => {
        console.error(`[${requestId}] Timeout alcanzado, finalizando función`);
        return res.status(504).json({ 
          error: 'Tiempo de espera agotado',
          message: 'La operación de eliminación ha excedido el tiempo de espera. Por favor intenta nuevamente.'
        });
      }, 25000); // 25 segundos para toda la función
      
      console.log(`[${requestId}] Conectando a MongoDB...`);
      await connectDB();
      
      console.log(`[${requestId}] Iniciando eliminación de conversaciones para userId: ${session.user.sub}`);
      
      // Implementar el deleteMany con timeout manual
      const deleteOperation = async () => {
        try {
          // Usar el modelo directamente en vez de una función
          return await Conversation.deleteMany({
            userId: session.user.sub
          }).exec(); // .exec() es importante para que se ejecute inmediatamente
        } catch (error) {
          console.error(`[${requestId}] Error en operación deleteMany:`, error);
          throw error;
        }
      };
      
      // Crear un timeout para la operación deleteMany
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación deleteMany excedió el timeout')), 20000);
      });
      
      // Ejecutar con race para gestionar timeout
      const result = await Promise.race([deleteOperation(), timeoutPromise]);
      
      // Limpiar el timeout de la función completa
      clearTimeout(functionTimeout);
      
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
      
      // Manejo específico para errores de timeout en MongoDB
      if (error.message && error.message.includes('buffering timed out')) {
        return res.status(504).json({
          error: 'Timeout en operación de base de datos',
          message: 'La operación ha excedido el tiempo máximo de espera. La base de datos puede estar sobrecargada.',
          details: error.message
        });
      }
      
      // Para otros errores
      return res.status(500).json({ 
        error: 'Error al eliminar las conversaciones',
        details: error.message
      });
    }
  } catch (mainError) {
    console.error(`[${requestId}] Error general en API:`, {
      error: mainError.message,
      stack: mainError.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({
      error: 'Error en el servidor',
      details: mainError.message
    });
  }
} 