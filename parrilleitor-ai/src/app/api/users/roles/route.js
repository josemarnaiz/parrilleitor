import { getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'
import { hasPremiumAccess, getUserInfo } from '@/config/auth0Config'
import { debugAuth0Session } from '@/config/debugger'

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
      
      if (session?.accessToken) {
        console.log('🔍 AUTH0 ACCESS TOKEN DATA:', {
          timestamp: new Date().toISOString(),
          token: session.accessToken
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
    if (!session?.accessToken) {
      return Response.json({
        user: {
          email: null,
          name: null,
          scopes: [],
          isPremium: false,
          isAllowedListUser: false,
          hasPremiumAccess: false,
          isAuthenticated: false
        }
      }, {
        headers: commonHeaders
      });
    }

    // Obtener información del usuario usando el endpoint userinfo
    const userInfo = await getUserInfo(session.accessToken);
    
    if (!userInfo) {
      throw new Error('Failed to fetch user info');
    }

    // Extraer información básica del usuario
    const { email = '', name = '' } = userInfo;

    // Verificar lista de permitidos
    const isAllowedListUser = isInAllowedList(email);

    // Verificar acceso premium usando los scopes del access token
    const hasPremiumFromScopes = hasPremiumAccess(session.accessToken);

    // Log de la decisión final
    console.log('Roles endpoint - Authorization check:', {
      email,
      scopes: session.accessToken.scope,
      isAllowedListUser,
      hasPremiumFromScopes,
      isPremium: isAllowedListUser || hasPremiumFromScopes,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      user: {
        email,
        name,
        scopes: session.accessToken.scope.split(' '),
        isPremium: isAllowedListUser || hasPremiumFromScopes,
        isAllowedListUser,
        hasPremiumAccess: hasPremiumFromScopes,
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
        scopes: [],
        isPremium: false,
        isAllowedListUser: false,
        hasPremiumAccess: false,
        isAuthenticated: false,
        isTemporary: true
      },
      error: 'Error al verificar acceso',
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