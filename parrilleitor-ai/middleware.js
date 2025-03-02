import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from './src/config/allowedUsers'
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
    
    // Verificar acceso con lógica mejorada
    const isAllowedUser = isInAllowedList(userEmail)
    
    // Múltiples intentos para obtener roles
    let roles = [];
    let hasPremiumRole = false;
    
    // Log del objeto de usuario para depuración
    console.log('Middleware - User object keys:', Object.keys(session.user));
    
    // Método 1: Namespace estándar
    if (session.user[AUTH0_NAMESPACE]) {
      roles = session.user[AUTH0_NAMESPACE];
      console.log('Middleware - Roles found using standard namespace:', roles);
    } 
    // Método 2: Propiedad roles directa
    else if (session.user.roles) {
      roles = session.user.roles;
      console.log('Middleware - Roles found using direct roles property:', roles);
    } 
    // Método 3: Buscar en las propiedades del usuario
    else {
      console.log('Middleware - Searching for roles in user properties...');
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
    
    // Verificar si el rol premium está presente
    hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    
    // Para usuarios de prueba, verificar también por nombre del rol
    if (!hasPremiumRole && Array.isArray(roles)) {
      hasPremiumRole = roles.some(role => 
        typeof role === 'string' && 
        (role.toLowerCase().includes('premium') || role === PREMIUM_ROLE_ID)
      );
      if (hasPremiumRole) {
        console.log('Middleware - Premium role detected by name in:', roles);
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