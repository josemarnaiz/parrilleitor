import { getSession } from '@auth0/nextjs-auth0/edge'
import { debugAuth0Session, logAuth0Data } from '@/config/debugger'
import { hasPremiumAccess, auth0Config } from '@/config/auth0Config'
import { isInAllowedList } from '@/config/allowedUsers'

// Headers comunes
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

/**
 * Endpoint de depuración para Auth0
 * Muestra información detallada sobre la sesión y el token
 */
export async function GET(req) {
  try {
    // Obtener la sesión
    let session = null;
    try {
      session = await getSession(req);
      
      // Punto de depuración para analizar la sesión
      debugAuth0Session(session, 'debug-api-auth0', {
        url: req.url,
        headers: Object.fromEntries(req.headers)
      });
    } catch (error) {
      console.error('Error al obtener la sesión:', error);
      return Response.json({
        error: 'Error al obtener la sesión',
        message: error.message,
        timestamp: new Date().toISOString()
      }, {
        status: 500,
        headers: commonHeaders
      });
    }
    
    // Si no hay sesión, informar
    if (!session || !session.user) {
      return Response.json({
        authenticated: false,
        error: 'No hay sesión activa',
        hint: 'Inicia sesión primero y luego accede a este endpoint',
        timestamp: new Date().toISOString()
      }, {
        status: 401,
        headers: commonHeaders
      });
    }
    
    // Extraer información importante
    const user = session.user;
    const email = user.email;
    const baseNamespace = auth0Config.baseNamespace;
    const isAllowedListUser = isInAllowedList(email);
    
    // Verificar rol premium con nuestra función existente
    const hasPremiumRole = hasPremiumAccess(user);
    
    // Datos recopilados para depuración
    const debugData = {
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        sub: user.sub,
        updatedAt: user.updated_at,
      },
      accessCheck: {
        isAllowedListUser,
        hasPremiumRole,
        hasAccess: isAllowedListUser || hasPremiumRole
      },
      authClaims: {
        // Verificar isPremium en ubicaciones directas
        isPremiumDirect: user[`${baseNamespace}/isPremium`],
        premiumVerifiedAt: user[`${baseNamespace}/premiumVerifiedAt`],
        // Buscar roles en ubicaciones conocidas
        standardRoles: user[`${baseNamespace}/roles`],
        rolesProperty: user.roles,
      },
      // Objeto de usuario filtrado (sin propiedades internas de Auth0)
      filteredUserObject: Object.fromEntries(
        Object.entries(user).filter(([key]) => 
          !key.startsWith('_') && 
          key !== 'accessToken' && 
          key !== 'idToken' && 
          key !== 'refreshToken'
        )
      ),
      timestamp: new Date().toISOString()
    };
    
    // Buscar todas las propiedades que podrían contener "premium" o "rol"
    const premiumRelatedProps = {};
    for (const key of Object.keys(user)) {
      if (
        (typeof user[key] === 'string' && (user[key].includes('premium') || user[key].includes('rol'))) ||
        (Array.isArray(user[key]) && user[key].some(v => typeof v === 'string' && (v.includes('premium') || v.includes('rol'))))
      ) {
        premiumRelatedProps[key] = user[key];
      }
    }
    
    debugData.premiumRelatedProperties = premiumRelatedProps;
    
    // Devolver la información para depuración
    return Response.json(debugData, {
      status: 200,
      headers: commonHeaders
    });
  } catch (error) {
    console.error('Error general en el endpoint de depuración:', error);
    return Response.json({
      error: 'Error general',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: commonHeaders
    });
  }
}

// Manejar peticiones OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...commonHeaders,
      'Access-Control-Max-Age': '86400'
    }
  });
} 