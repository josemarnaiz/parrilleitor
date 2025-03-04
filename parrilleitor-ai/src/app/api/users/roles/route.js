import { getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'
import { hasPremiumAccess, auth0Config, getUserRoles } from '@/config/auth0Config'
import { debugAuth0Session, logAuth0Data } from '@/config/debugger'

// Obtener namespaces de Auth0
const AUTH0_BASE_NAMESPACE = auth0Config.baseNamespace
const AUTH0_ROLES_NAMESPACE = `${AUTH0_BASE_NAMESPACE}/roles`

// LOG TEMPORAL PARA DEBUGGEAR ROLES DE AUTH0
const DEBUG_AUTH0 = true

const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'
const PREMIUM_ROLE_NAME = 'Premium'

// Obtener la URL base actual
const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'

// Headers comunes
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-next-router-state-tree, x-next-url, x-auth-token, x-client-version',
  'Access-Control-Allow-Credentials': 'true',
}

export async function GET(req) {
  try {
    // Intentar obtener la sesión
    let session = null;
    try {
      session = await getSession(req);
      
      // Log RAW de la sesión completa de Auth0
      console.log('🔍 AUTH0 RAW SESSION DATA:', {
        timestamp: new Date().toISOString(),
        sessionKeys: Object.keys(session || {}),
        fullSession: JSON.stringify(session, null, 2)
      });
      
      if (session?.user) {
        console.log('🔍 AUTH0 RAW USER DATA:', {
          timestamp: new Date().toISOString(),
          userKeys: Object.keys(session.user),
          fullUser: JSON.stringify(session.user, null, 2)
        });
        
        // Log específico de claims importantes
        const claimKeys = Object.values(auth0Config.claims);
        const relevantClaims = {};
        claimKeys.forEach(key => {
          relevantClaims[key] = session.user[key];
        });
        
        console.log('🔍 AUTH0 RELEVANT CLAIMS:', {
          timestamp: new Date().toISOString(),
          claims: relevantClaims
        });
      }
      
      // Debug de la sesión
      debugAuth0Session(session, 'roles-api-get', {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers)
      });
    } catch (sessionError) {
      console.log('Error getting session:', {
        error: sessionError.message,
        stack: sessionError.stack,
        timestamp: new Date().toISOString()
      });
    }

    // Si no hay sesión, devolver estado no autenticado
    if (!session?.user) {
      return Response.json({
        user: {
          email: null,
          name: null,
          roles: [],
          isPremium: false,
          isAllowedListUser: false,
          hasPremiumRole: false,
          isAuthenticated: false
        }
      }, {
        headers: commonHeaders
      });
    }

    // Extraer información básica del usuario
    const { email = '', name = '' } = session.user;

    // Verificar lista de permitidos
    const isAllowedListUser = isInAllowedList(email);

    // Obtener roles usando la nueva función helper
    const roles = getUserRoles(session.user);

    // Verificar acceso premium usando la nueva función helper
    const hasPremiumRole = hasPremiumAccess(session.user);

    // Log de la decisión final
    console.log('Roles endpoint - Authorization check:', {
      email,
      roles,
      isAllowedListUser,
      hasPremiumRole,
      isPremium: isAllowedListUser || hasPremiumRole,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      user: {
        email,
        name,
        roles,
        isPremium: isAllowedListUser || hasPremiumRole,
        isAllowedListUser,
        hasPremiumRole,
        isAuthenticated: true
      }
    }, {
      headers: commonHeaders
    });

  } catch (error) {
    console.error('Roles endpoint - Error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    });

    // En caso de error, devolver estado temporal no premium
    return Response.json({
      user: {
        email: 'error@example.com',
        name: 'Error User',
        roles: [],
        isPremium: false,
        isAllowedListUser: false,
        hasPremiumRole: false,
        isAuthenticated: false,
        isTemporary: true
      },
      error: 'Error al verificar roles',
      details: error.message,
      type: error.constructor.name
    }, {
      status: 200,
      headers: commonHeaders
    });
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: commonHeaders
  })
}

export const runtime = 'edge' 