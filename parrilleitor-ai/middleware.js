import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from './src/config/allowedUsers'
import { hasPremiumAccess, auth0Config } from './src/config/auth0Config'
import { debugAuth0Session, logAuth0Data } from './src/config/debugger'
import { logAuth, logAuthError, logAccess } from './src/config/logger'
import { NextResponse } from 'next/server'

// Configuración
const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app';
const AUTH0_BASE_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com';

// Rutas protegidas que requieren autenticación
const PROTECTED_ROUTES = [
  '/chat',
  '/api/chat',
  '/api/chat/'
];

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

// Verificar si una ruta requiere autenticación
function isProtectedRoute(path) {
  return PROTECTED_ROUTES.some(route => {
    if (route.endsWith('/')) {
      return path === route || path.startsWith(route);
    }
    return path === route || path.startsWith(`${route}/`);
  });
}

export default async function middleware(req) {
  const path = req.nextUrl.pathname;
  const requestId = crypto.randomUUID(); // ID único para seguir esta solicitud en los logs

  try {
    // Manejar solicitudes OPTIONS (preflight) con CORS adecuado
    if (req.method === 'OPTIONS') {
      logInfo('CORS preflight request', { path, requestId });
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // No aplicar middleware a rutas públicas
    if (publicPaths.some(p => path.startsWith(p))) {
      logInfo('Public path access', { path, requestId });
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    // Get session
    let session = null;
    try {
      session = await getSession(req);
      
      // Log detallado de la sesión
      logAuth('Session obtained in middleware', session, { 
        path, 
        requestId,
        headers: Object.fromEntries(req.headers) 
      });
      
      // Si estamos en modo desarrollo, usar también el debug con breakpoints
      if (process.env.NODE_ENV === 'development') {
        // Punto de depuración para analizar la sesión
        debugAuth0Session(session, 'middleware-initial', {
          path: req.nextUrl.pathname,
          method: req.method,
          headers: Object.fromEntries(req.headers)
        });
      }
    } catch (error) {
      logAuthError('Error getting session in middleware', error, null, { path, requestId });
    }
    
    // Log session state
    console.log('Middleware session check:', {
      path,
      requestId,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString()
    });

    // Log detallado del objeto de usuario completo para diagnosticar problemas de roles
    if (session?.user) {
      logAuth('User authenticated in middleware', session, {
        path,
        requestId,
        userKeys: Object.keys(session.user)
      });
      
      // En desarrollo, log adicional
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware - Auth0 user object:', JSON.stringify(session.user, null, 2));
        console.log('Middleware - Auth0 user keys:', Object.keys(session.user));
      }
    }
    
    // Si no hay sesión, redirigir a la página de inicio para iniciar sesión
    if (!session?.user) {
      logAuth('No session, redirecting', null, { path, requestId });
      
      // Redirigir a la página principal si es una ruta de interfaz de usuario
      if (path === '/chat') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // Para APIs, devolver error 401
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autenticado' }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    const userEmail = session.user.email;
    
    // En desarrollo, log adicional
    if (process.env.NODE_ENV === 'development') {
      // Otro punto de depuración antes de verificar rol premium
      logAuth0Data(session, 'middleware-premium-check', {
        isAllowedUser: isAllowedList(userEmail)
      });
    }
    
    // Verificar rol premium de forma centralizada
    const hasPremiumRole = hasPremiumAccess(session);
    logAuth('Premium access check result', session, {
      path,
      requestId,
      hasPremiumRole,
      method: 'hasPremiumAccess'
    });

    const isAllowedUser = isAllowedList(userEmail);
    
    // Log para depuración
    console.log(`Middleware check: path=${path}, premium=${hasPremiumRole}, allowed=${isAllowedUser}`);
    
    // Si no tiene rol premium ni está en lista de permitidos, redirigir
    if (!hasPremiumRole && !isAllowedUser && isProtectedRoute(path)) {
      logAuth('No premium access, redirecting to unauthorized', session, {
        path,
        requestId,
        redirectTo: '/unauthorized'
      });
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Si no tiene acceso premium pero intenta acceder a APIs del chat, devolver 403
    if (!hasPremiumRole && path.startsWith('/api/chat')) {
      logAuth('No premium access, blocking API access', session, {
        path,
        requestId,
        status: 403
      });
      return new Response(JSON.stringify({ error: 'Se requiere una cuenta premium' }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Allow the request to proceed
    logAuth('Request allowed to proceed', session, {
      path,
      requestId,
      hasAccess: hasPremiumRole || isAllowedUser
    });
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    // Log detallado del error
    logAuthError('Error in middleware', error, null, {
      path,
      requestId
    });
    
    return new Response(JSON.stringify({ error: 'Error en el middleware' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
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