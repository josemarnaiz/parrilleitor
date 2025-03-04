import { getSession } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';
import { isInAllowedList } from '../../../config/allowedUsers';
import { hasPremiumAccess, auth0Config } from '../../../config/auth0Config';
import { logAuth, logAuthError, logError } from '../../../config/logger';
// Detectar si estamos en Edge Runtime
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined';
// Importar la versión apropiada de MongoDB según el entorno
const { connectToDatabase } = isEdgeRuntime 
  ? require('../../../lib/mongodb-edge') 
  : require('../../../lib/mongodb');

// Lista de correos electrónicos autorizados para acceder a los logs completos (solo administradores)
const ADMIN_EMAILS = ['user1@example.com', 'user2@example.com']; // Reemplazar con correos reales
const LOG_LIMIT = 100; // Límite de entradas de log a recuperar

// Headers CORS comunes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Verifica si un usuario es administrador y tiene acceso a los logs completos
 * @param {string} email - Correo electrónico del usuario
 * @returns {boolean} - True si el usuario tiene acceso de administrador
 */
function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

/**
 * Maneja solicitudes GET para obtener los logs del sistema
 * Solo administradores pueden acceder a los logs completos
 */
export async function GET(req) {
  const requestId = crypto.randomUUID();
  
  try {
    // Obtener la sesión del usuario
    const session = await getSession(req);

    // Verificar autenticación
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor, inicie sesión.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verificar si el usuario tiene acceso a los logs
    const userEmail = session.user.email;
    const isUserAdmin = isAdmin(userEmail);
    const isAllowedUser = isInAllowedList(userEmail);
    const hasPremium = hasPremiumAccess(session.user);
    const hasAccess = isUserAdmin || (isAllowedUser && hasPremium);

    // Si no tiene acceso, devolver acceso denegado
    if (!hasAccess) {
      logAuthError('Logs access denied', null, session, { 
        requestId,
        userEmail,
        isAdmin: isUserAdmin
      });
      
      return NextResponse.json(
        { error: 'Se requiere acceso de administrador para ver los logs.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Obtener parámetros de consulta
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all'; // Tipo de logs: auth, error, all
    const days = parseInt(url.searchParams.get('days') || '1'); // Días hacia atrás para buscar logs
    const limit = parseInt(url.searchParams.get('limit') || LOG_LIMIT.toString());
    
    // Limitar a un máximo razonable y mínimo de 1
    const safeLimit = Math.min(Math.max(1, limit), LOG_LIMIT);
    // Limitar días a un máximo razonable (7 días) y mínimo de 1
    const safeDays = Math.min(Math.max(1, days), 7);
    
    // Calcular la fecha límite hacia atrás para la búsqueda
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - safeDays);
    
    // Construir el filtro para MongoDB
    let filter = { timestamp: { $gte: dateLimit } };
    if (type === 'auth') {
      filter.level = { $in: ['AUTH', 'AUTH_ERROR'] };
    } else if (type === 'error') {
      filter.level = { $in: ['ERROR', 'AUTH_ERROR'] };
    }
    
    try {
      // Si estamos en Edge Runtime, no podemos conectar a MongoDB
      if (isEdgeRuntime) {
        return NextResponse.json({
          logs: [],
          meta: {
            count: 0,
            type,
            days: safeDays,
            isAdmin: isUserAdmin,
            environment: 'edge',
            message: 'Los logs de MongoDB no están disponibles en Edge Runtime'
          }
        }, { headers: corsHeaders });
      }
      
      // Conectar a la base de datos (solo en Node.js runtime)
      const { db } = await connectToDatabase();
      
      // Obtener los logs de la colección de logs
      const collection = db.collection('logs');
      const logs = await collection
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(safeLimit)
        .toArray();
      
      // Registrar la consulta exitosa
      logAuth('Logs retrieved successfully', session, {
        requestId,
        count: logs.length,
        type,
        days: safeDays,
        isAdmin: isUserAdmin
      });
      
      // Si no es administrador, filtrar información sensible
      let sanitizedLogs = logs;
      if (!isUserAdmin) {
        sanitizedLogs = logs.map(log => {
          const { _id, message, level, timestamp, path, requestId } = log;
          // Solo incluir información no sensible
          return { _id, message, level, timestamp, path, requestId };
        });
      }
      
      return NextResponse.json({
        logs: sanitizedLogs,
        meta: {
          count: logs.length,
          type,
          days: safeDays,
          isAdmin: isUserAdmin
        }
      }, { headers: corsHeaders });
      
    } catch (dbError) {
      // Error al conectar a la base de datos o consultar los logs
      logError('Database error retrieving logs', dbError, {
        requestId,
        type,
        days: safeDays
      });
      
      return NextResponse.json({
        error: 'Error al acceder a los logs en la base de datos',
        message: isUserAdmin ? dbError.message : 'Error de base de datos'
      }, { status: 500, headers: corsHeaders });
    }
    
  } catch (error) {
    // Error general en el endpoint
    logError('Error in logs endpoint', error, { requestId });
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado al procesar la solicitud de logs'
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Maneja solicitudes OPTIONS para CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400'
    }
  });
} 