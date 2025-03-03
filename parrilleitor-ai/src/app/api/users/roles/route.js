import { getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'
import { hasPremiumAccess } from '@/config/auth0Config'

// Actualizo configuración de Auth0 - puede variar el formato según la configuración
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const ALTERNATIVE_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/user_authorization'

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

    // Log detallado del objeto de usuario completo para diagnosticar problemas de roles
    if (session?.user) {
      console.log('Roles endpoint - Auth0 user object:', JSON.stringify(session.user, null, 2));
      console.log('Roles endpoint - Auth0 user keys:', Object.keys(session.user));
      
      // Examinar todas las propiedades en busca de posibles roles
      for (const key in session.user) {
        if (Array.isArray(session.user[key])) {
          console.log(`Roles endpoint - Found array property "${key}":`, session.user[key]);
        }
      }
    }

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
    
    // DEBUGGING TEMPORAL - Mostrar todas las propiedades del usuario para encontrar los roles
    if (DEBUG_AUTH0) {
      console.log('======= DEBUGGING AUTH0 USER OBJECT =======')
      console.log('User email:', session.user.email)
      console.log('User sub:', session.user.sub)
      
      // Listar todas las propiedades del objeto usuario
      console.log('All user properties:')
      Object.keys(session.user).forEach(key => {
        console.log(`Property "${key}":`, JSON.stringify(session.user[key], null, 2))
      })
      
      // Buscar cualquier propiedad que pueda contener la palabra "premium" o "rol"
      console.log('Properties potentially containing roles:')
      Object.keys(session.user).forEach(key => {
        const value = session.user[key]
        if (
          (typeof value === 'string' && (value.toLowerCase().includes('premium') || value.toLowerCase().includes('rol'))) ||
          (Array.isArray(value) && value.some(item => typeof item === 'string' && (item.toLowerCase().includes('premium') || item.toLowerCase().includes('rol'))))
        ) {
          console.log(`Found potential role info in "${key}":`, JSON.stringify(value, null, 2))
        }
      })
      
      console.log('======= END DEBUGGING AUTH0 =======')
    }

    // Check both Auth0 roles and allowed users list
    const isAllowedListUser = isInAllowedList(email)
    
    // VERIFICACIÓN DE ROL PREMIUM: Múltiples estrategias
    let roles = [];
    let hasPremiumRole = false;
    
    // Estrategia 1: Usar la función auxiliar de la configuración
    if (hasPremiumAccess(session.user)) {
      hasPremiumRole = true;
      console.log('DEBUG - Premium access detected by hasPremiumAccess helper');
    }
    // Si la función auxiliar no detectó nada, seguir con otras estrategias
    else {
      // Estrategia 2: Namespace estándar para roles
      if (session.user[AUTH0_NAMESPACE]) {
        roles = session.user[AUTH0_NAMESPACE];
        console.log('DEBUG - Roles found using standard namespace:', roles);
      } 
      // Estrategia 3: Propiedad roles directa
      else if (session.user.roles) {
        roles = session.user.roles;
        console.log('DEBUG - Roles found using direct roles property:', roles);
      } 
      // Estrategia 4: Buscar en sub-claims del objeto de usuario
      else if (session.user['https://dev-zwbfqql3rcbh67rv.us.auth0.com']) {
        const authClaims = session.user['https://dev-zwbfqql3rcbh67rv.us.auth0.com'];
        console.log('DEBUG - Found Auth0 claims object:', authClaims);
        
        if (authClaims.roles) {
          roles = authClaims.roles;
          console.log('DEBUG - Roles found in Auth0 claims:', roles);
        }
      }
      // Estrategia 5: Buscar en todas las propiedades del usuario
      else {
        console.log('DEBUG - Searching for roles in all user properties...');
        // Buscar cualquier propiedad que pueda contener roles
        for (const key in session.user) {
          if (Array.isArray(session.user[key])) {
            console.log(`DEBUG - Found array property "${key}":`, session.user[key]);
            // Si contiene el ID del rol premium, usarla
            if (session.user[key].includes(PREMIUM_ROLE_ID)) {
              roles = session.user[key];
              console.log(`DEBUG - Using "${key}" as roles property:`, roles);
              break;
            }
          }
        }
      }
      
      // Verificación del rol premium en los roles encontrados
      
      // Método 1: Verificar por ID exacto del rol
      if (roles.includes(PREMIUM_ROLE_ID)) {
        hasPremiumRole = true;
        console.log(`DEBUG - Premium role detected by ID match: ${PREMIUM_ROLE_ID}`);
      } 
      // Método 2: Verificar por nombre del rol
      else if (Array.isArray(roles)) {
        hasPremiumRole = roles.some(role => 
          typeof role === 'string' && 
          (role.toLowerCase().includes('premium') || role.startsWith('rol_'))
        );
        if (hasPremiumRole) {
          console.log('DEBUG - Premium role detected by name pattern in:', roles);
        }
      }
      
      // Método 3: Verificar por otras propiedades en el token
      if (!hasPremiumRole) {
        // Buscar cualquier indicador de premium en el token
        for (const key in session.user) {
          const value = session.user[key];
          
          // Verificar propiedades que podrían indicar estado premium
          if (typeof value === 'string' && value.toLowerCase().includes('premium')) {
            console.log(`DEBUG - Premium indicator found in property "${key}":`, value);
            hasPremiumRole = true;
            break;
          }
          
          // Verificar objetos anidados
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            for (const subKey in value) {
              const subValue = value[subKey];
              if (
                (typeof subValue === 'string' && subValue.toLowerCase().includes('premium')) ||
                (subValue === true && subKey.toLowerCase().includes('premium'))
              ) {
                console.log(`DEBUG - Premium indicator found in nested property "${key}.${subKey}":`, subValue);
                hasPremiumRole = true;
                break;
              }
            }
          }
        }
      }
    }
    
    // DECISIÓN FINAL: Un usuario es premium si está en la lista de permitidos o tiene rol premium
    const isPremium = isAllowedListUser || hasPremiumRole;

    // Log completo para debugging
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