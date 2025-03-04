import { getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'
import { hasPremiumAccess, getUserInfo, auth0Config } from '@/config/auth0Config'
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
    } catch (sessionError) {
      console.error('Session error:', sessionError.message);
    }

    // Si no hay sesión, devolver estado no autenticado
    if (!session?.accessToken) {
      return Response.json({
        user: {
          email: null,
          name: null,
          isPremium: false,
          isAllowedListUser: false,
          hasPremiumAccess: false,
          isAuthenticated: false,
          premiumVerifiedAt: null,
          lastChecked: new Date().toISOString()
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

    // Verificar acceso premium usando los claims del access token
    const hasPremiumFromClaims = hasPremiumAccess(session.accessToken);
    const verifiedAtClaim = `${auth0Config.customClaims.namespace}/${auth0Config.customClaims.premiumVerifiedAt}`;
    const premiumVerifiedAt = session.accessToken[verifiedAtClaim];

    return Response.json({
      user: {
        email,
        name,
        isPremium: isAllowedListUser || hasPremiumFromClaims,
        isAllowedListUser,
        hasPremiumAccess: hasPremiumFromClaims,
        isAuthenticated: true,
        premiumVerifiedAt,
        lastChecked: new Date().toISOString()
      }
    }, {
      headers: commonHeaders
    });

  } catch (error) {
    console.error('Roles endpoint error:', error.message);

    // En caso de error, devolver estado temporal no premium
    return Response.json({
      user: {
        email: 'error@example.com',
        name: 'Error User',
        isPremium: false,
        isAllowedListUser: false,
        hasPremiumAccess: false,
        isAuthenticated: false,
        isTemporary: true,
        premiumVerifiedAt: null,
        lastChecked: new Date().toISOString()
      },
      error: 'Error al verificar acceso'
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