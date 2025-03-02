import { getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

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
    // Intentar obtener la sesión, pero no fallar si no existe
    let session = null;
    try {
      session = await getSession(req);
    } catch (sessionError) {
      console.log('Error getting session, but continuing:', {
        error: sessionError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Debug session data
    console.log('Roles endpoint - Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries())
    })

    // Si no hay sesión pero hay token de autorización, intentar usar eso
    const authHeader = req.headers.get('authorization')
    if (!session?.user && authHeader) {
      console.log('No session but found auth header, attempting to use it')
      
      // En lugar de devolver un error, devolvemos un estado "no premium" temporal
      // Esto evita el ciclo de redirección/deslogeo
      return Response.json({
        user: {
          email: 'guest@example.com',
          name: 'Guest User',
          roles: [],
          isPremium: false,
          isAllowedListUser: false,
          hasPremiumRole: false,
          isTemporary: true
        },
        message: 'Sesión temporal - Por favor recarga la página si necesitas acceso completo'
      }, {
        status: 200,
        headers: commonHeaders
      })
    }

    if (!session?.user) {
      console.log('No session and no auth header found')
      
      // En lugar de devolver un error, devolvemos un estado "no premium" temporal
      // Esto evita el ciclo de redirección/deslogeo
      return Response.json({
        user: {
          email: 'guest@example.com',
          name: 'Guest User',
          roles: [],
          isPremium: false,
          isAllowedListUser: false,
          hasPremiumRole: false,
          isTemporary: true
        },
        message: 'Sesión no encontrada - Por favor inicia sesión para acceder'
      }, {
        status: 200,
        headers: commonHeaders
      })
    }

    const email = session.user.email
    const name = session.user.name || email

    // Log completo del objeto de usuario para depuración
    console.log('Auth0 complete user object:', JSON.stringify(session.user, null, 2))

    // Check both Auth0 roles and allowed users list
    const isAllowedListUser = isInAllowedList(email)
    
    // Múltiples intentos para obtener roles
    let roles = [];
    let hasPremiumRole = false;
    
    // Método 1: Namespace estándar
    if (session.user[AUTH0_NAMESPACE]) {
      roles = session.user[AUTH0_NAMESPACE];
      console.log('Roles found using standard namespace:', roles);
    } 
    // Método 2: Propiedad roles directa
    else if (session.user.roles) {
      roles = session.user.roles;
      console.log('Roles found using direct roles property:', roles);
    } 
    // Método 3: Buscar en las propiedades del usuario
    else {
      console.log('Searching for roles in user properties...');
      // Buscar cualquier propiedad que pueda contener roles
      for (const key in session.user) {
        if (Array.isArray(session.user[key])) {
          console.log(`Found array property "${key}":`, session.user[key]);
          // Si contiene el ID del rol premium, usarla
          if (session.user[key].includes(PREMIUM_ROLE_ID)) {
            roles = session.user[key];
            console.log(`Using "${key}" as roles property:`, roles);
            break;
          }
        }
      }
    }
    
    // Verificar si el rol premium está presente
    hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    
    // Para usuarios de prueba, verificar también por nombre del rol
    if (!hasPremiumRole && Array.isArray(roles)) {
      hasPremiumRole = roles.some(role => 
        typeof role === 'string' && 
        (role.toLowerCase().includes('premium') || role === PREMIUM_ROLE_ID)
      );
      if (hasPremiumRole) {
        console.log('Premium role detected by name in:', roles);
      }
    }
    
    // Decisión final: un usuario es premium si está en la lista de permitidos o tiene el rol premium
    const isPremium = isAllowedListUser || hasPremiumRole

    // Log authorization details
    console.log('Roles endpoint - Authorization check:', {
      email,
      roles,
      isAllowedListUser,
      hasPremiumRole,
      isPremium,
      timestamp: new Date().toISOString()
    })

    return Response.json({
      user: {
        email,
        name,
        roles,
        isPremium,
        isAllowedListUser,
        hasPremiumRole
      }
    }, {
      headers: commonHeaders
    })

  } catch (error) {
    // Enhanced error logging
    console.error('Roles endpoint - Error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    })

    // En caso de error, devolvemos un estado "no premium" temporal
    // Esto evita el ciclo de redirección/deslogeo
    return Response.json({
      user: {
        email: 'error@example.com',
        name: 'Error User',
        roles: [],
        isPremium: false,
        isAllowedListUser: false,
        hasPremiumRole: false,
        isTemporary: true
      },
      error: 'Error al verificar roles',
      details: error.message,
      type: error.constructor.name
    }, {
      status: 200,
      headers: commonHeaders
    })
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: commonHeaders
  })
}

export const runtime = 'edge' 