import { getSession } from '@auth0/nextjs-auth0/edge'
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

// Lista de emails con acceso a la información completa de depuración
const DEBUG_ACCESS_EMAILS = [
  'tu.email@ejemplo.com',  // Reemplaza con tu email
  'admin@parrilleitor.com'
];

// Verificar si un usuario tiene acceso a diagnóstico completo
function hasDebugAccess(email) {
  if (!email) return false;
  return DEBUG_ACCESS_EMAILS.includes(email.toLowerCase());
}

/**
 * Endpoint de depuración para Auth0 - Versión de producción
 * Muestra información detallada sobre la sesión y el token
 */
export async function GET(req) {
  try {
    // Obtener la sesión
    let session = null;
    try {
      session = await getSession(req);
    } catch (error) {
      console.error('Error al obtener la sesión:', error);
      return Response.json({
        error: 'Error al obtener la sesión',
        message: error.message,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        vercel: !!process.env.VERCEL
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
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        vercel: !!process.env.VERCEL
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
    
    // Verificar si tiene acceso a diagnóstico completo
    const hasFullDebugAccess = hasDebugAccess(email);
    
    // Datos recopilados para depuración
    const debugData = {
      requestInfo: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        isVercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION || 'unknown',
        url: req.url,
        method: req.method,
      },
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
        hasAccess: isAllowedListUser || hasPremiumRole,
        roles: {
          // Verificar isPremium en ubicaciones directas
          isPremiumDirect: user[`${baseNamespace}/isPremium`] || false,
          premiumVerifiedAt: user[`${baseNamespace}/premiumVerifiedAt`] || null,
          // Buscar roles en ubicaciones conocidas
          standardRoles: user[`${baseNamespace}/roles`] || [],
          rolesProperty: user.roles || [],
          inAllowedList: isAllowedListUser,
        }
      }
    };
    
    // Si tiene acceso a diagnóstico completo, incluir información adicional
    if (hasFullDebugAccess) {
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
      
      // Añadir información técnica adicional
      debugData.technicalInfo = {
        userKeys: Object.keys(user),
        auth0Namespaces: {
          baseNamespace: baseNamespace,
          rolesNamespace: `${baseNamespace}/roles`,
          isPremiumPath: `${baseNamespace}/isPremium`
        },
        detectedNamespaces: Object.keys(user).filter(k => k.includes('https://')),
        sessionInfo: {
          hasExpiration: !!session.exp,
          expiration: session.exp ? new Date(session.exp * 1000).toISOString() : null,
          issuedAt: session.iat ? new Date(session.iat * 1000).toISOString() : null,
        }
      };
      
      // Filtrar el objeto usuario completo para diagnóstico avanzado
      debugData.fullUserObject = Object.fromEntries(
        Object.entries(user).filter(([key]) => 
          !key.startsWith('_') && 
          key !== 'accessToken' && 
          key !== 'idToken' && 
          key !== 'refreshToken'
        )
      );
    } else {
      debugData.notice = "Información limitada. Para acceso completo de diagnóstico, contacta al administrador.";
    }
    
    // Añadir información de recomendación
    debugData.recommendation = {
      hasFullAccess: isAllowedListUser || hasPremiumRole,
      suggestedAction: (!isAllowedListUser && !hasPremiumRole) 
        ? "Contactar al soporte para verificar tu suscripción premium" 
        : "Tu acceso está configurado correctamente"
    };
    
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
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercel: !!process.env.VERCEL
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