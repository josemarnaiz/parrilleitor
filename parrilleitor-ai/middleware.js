import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from './src/config/allowedUsers'
import { hasPremiumAccess } from './src/config/auth0Config'
import { NextResponse } from 'next/server'

// Actualizar el namespace para roles
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

// Rutas que no requieren autenticación
const publicPaths = [
  '/',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/callback',
  '/api/auth/me',
  '/unauthorized'
]

// Configuración CORS común
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-next-router-state-tree, x-next-url, x-auth-token, x-client-version',
  'Access-Control-Allow-Credentials': 'true',
  'Cache-Control': 'no-store, max-age=0'
}

export default async function middleware(req) {
  try {
    // Manejar solicitudes OPTIONS (preflight) con CORS adecuado
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // No aplicar middleware a rutas públicas
    const path = req.nextUrl.pathname
    if (publicPaths.some(p => path.startsWith(p))) {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      })
    }

    // Get session
    const session = await getSession(req)
    
    // Log session state
    console.log('Middleware session check:', {
      path,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString()
    })

    // Log detallado del objeto de usuario completo para diagnosticar problemas de roles
    if (session?.user) {
      console.log('Middleware - Auth0 user object:', JSON.stringify(session.user, null, 2));
      console.log('Middleware - Auth0 user keys:', Object.keys(session.user));
      
      // Examinar todas las propiedades en busca de posibles roles
      for (const key in session.user) {
        if (Array.isArray(session.user[key])) {
          console.log(`Middleware - Found array property "${key}":`, session.user[key]);
        }
      }
    }
    
    // Si no hay sesión, redirigir a la página de inicio para iniciar sesión
    if (!session?.user) {
      console.log('No session, redirecting to home:', {
        path,
        timestamp: new Date().toISOString()
      })
      
      // Redirigir a la página principal si es una ruta de interfaz de usuario
      if (path === '/chat') {
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      // Para APIs, devolver error 401
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autenticado' }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }
      
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      })
    }

    const userEmail = session.user.email
    
    // VERIFICACIÓN DE ACCESO: Múltiples estrategias
    const isAllowedUser = isInAllowedList(userEmail)
    
    // VERIFICACIÓN DE ROL PREMIUM: Múltiples estrategias
    let roles = [];
    let hasPremiumRole = false;
    
    // Estrategia 1: Usar la función auxiliar de la configuración
    if (hasPremiumAccess(session.user)) {
      hasPremiumRole = true;
      console.log('Middleware - Premium access detected by hasPremiumAccess helper');
    } 
    // Si la función auxiliar no detectó nada, seguir con otras estrategias
    else {
      // Estrategia 2: Namespace estándar para roles
      if (session.user[AUTH0_NAMESPACE]) {
        roles = session.user[AUTH0_NAMESPACE];
        console.log('Middleware - Roles found using standard namespace:', roles);
      } 
      // Estrategia 3: Propiedad roles directa
      else if (session.user.roles) {
        roles = session.user.roles;
        console.log('Middleware - Roles found using direct roles property:', roles);
      } 
      // Estrategia 4: Buscar en sub-claims del objeto de usuario
      else if (session.user['https://dev-zwbfqql3rcbh67rv.us.auth0.com']) {
        const authClaims = session.user['https://dev-zwbfqql3rcbh67rv.us.auth0.com'];
        console.log('Middleware - Found Auth0 claims object:', authClaims);
        
        if (authClaims.roles) {
          roles = authClaims.roles;
          console.log('Middleware - Roles found in Auth0 claims:', roles);
        }
      }
      // Estrategia 5: Buscar en todas las propiedades del usuario
      else {
        console.log('Middleware - Searching for roles in all user properties...');
        // Buscar cualquier propiedad que pueda contener roles
        for (const key in session.user) {
          if (Array.isArray(session.user[key])) {
            console.log(`Middleware - Found array property "${key}":`, session.user[key]);
            // Si contiene el ID del rol premium, usarla
            if (session.user[key].includes(PREMIUM_ROLE_ID)) {
              roles = session.user[key];
              console.log(`Middleware - Using "${key}" as roles property:`, roles);
              break;
            }
          }
        }
      }
      
      // Verificación del rol premium en los roles encontrados
      
      // Método 1: Verificar por ID exacto del rol
      if (roles.includes(PREMIUM_ROLE_ID)) {
        hasPremiumRole = true;
        console.log(`Middleware - Premium role detected by ID match: ${PREMIUM_ROLE_ID}`);
      } 
      // Método 2: Verificar por nombre del rol
      else if (Array.isArray(roles)) {
        hasPremiumRole = roles.some(role => 
          typeof role === 'string' && 
          (role.toLowerCase().includes('premium') || role.startsWith('rol_'))
        );
        if (hasPremiumRole) {
          console.log('Middleware - Premium role detected by name pattern in:', roles);
        }
      }
      
      // Método 3: Verificar por otras propiedades en el token
      if (!hasPremiumRole) {
        // Buscar cualquier indicador de premium en el token
        for (const key in session.user) {
          const value = session.user[key];
          
          // Verificar propiedades que podrían indicar estado premium
          if (typeof value === 'string' && value.toLowerCase().includes('premium')) {
            console.log(`Middleware - Premium indicator found in property "${key}":`, value);
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
                console.log(`Middleware - Premium indicator found in nested property "${key}.${subKey}":`, subValue);
                hasPremiumRole = true;
                break;
              }
            }
          }
        }
      }
    }
    
    // Decisión final sobre el acceso
    const hasAccess = isAllowedUser || hasPremiumRole

    // Log de verificación
    console.log('Access verification:', {
      email: userEmail,
      isAllowedUser,
      hasPremiumRole,
      hasAccess,
      path,
      timestamp: new Date().toISOString()
    })

    // Si no tiene acceso premium pero intenta acceder a /chat, redirigir a unauthorized
    if (!hasAccess && path === '/chat') {
      console.log('User does not have premium access, redirecting to unauthorized:', {
        email: userEmail,
        path,
        timestamp: new Date().toISOString()
      })
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    // Si no tiene acceso premium pero intenta acceder a APIs del chat, devolver 403
    if (!hasAccess && path.startsWith('/api/chat')) {
      console.log('User does not have premium access, blocking API access:', {
        email: userEmail,
        path,
        timestamp: new Date().toISOString()
      })
      return new Response(JSON.stringify({ error: 'Se requiere una cuenta premium' }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Allow the request to proceed
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
    
  } catch (error) {
    console.error('Middleware error:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name,
      path: req.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })
    
    // En caso de error, permitir que la solicitud continúe
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }
}

export const config = {
  matcher: [
    '/chat',
    '/api/chat/:path*',
    '/admin/:path*'
  ]
}

export const runtime = 'edge' 