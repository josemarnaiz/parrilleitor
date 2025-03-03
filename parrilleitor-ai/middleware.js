import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from './src/config/allowedUsers'
import { hasPremiumAccess, auth0Config } from './src/config/auth0Config'
import { debugAuth0Session, logAuth0Data } from './src/config/debugger'
import { logAuth, logAuthError, logAccess } from './src/config/logger'
import { NextResponse } from 'next/server'

// Obtener el namespace base de Auth0 para verificaciones
const AUTH0_BASE_NAMESPACE = auth0Config.baseNamespace
const AUTH0_ROLES_NAMESPACE = `${AUTH0_BASE_NAMESPACE}/roles`

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
    
    // VERIFICACIÓN DE ACCESO: Múltiples estrategias
    const isAllowedUser = isInAllowedList(userEmail);
    
    // VERIFICACIÓN DE ROL PREMIUM: Múltiples estrategias
    let roles = [];
    let hasPremiumRole = false;
    
    // Log detallado antes de verificar roles
    logAuth('Verifying premium access', session, {
      path,
      requestId,
      isAllowedUser
    });
    
    // En desarrollo, log adicional
    if (process.env.NODE_ENV === 'development') {
      // Otro punto de depuración antes de verificar rol premium
      logAuth0Data(session, 'middleware-premium-check', {
        isAllowedUser: isAllowedList(userEmail)
      });
    }
    
    // Estrategia 0: Verificar el nuevo atributo isPremium (prioridad máxima)
    if (session.user[`${AUTH0_BASE_NAMESPACE}/isPremium`] === true) {
      hasPremiumRole = true;
      logAuth('Premium access detected via direct claim', session, {
        path,
        requestId,
        method: 'direct-claim'
      });
    }
    // También verificar en objeto namespace
    else if (session.user[AUTH0_BASE_NAMESPACE] && session.user[AUTH0_BASE_NAMESPACE].isPremium === true) {
      hasPremiumRole = true;
      logAuth('Premium access detected via nested claim', session, {
        path,
        requestId,
        method: 'nested-claim'
      });
    }
    // Estrategia 1: Usar la función auxiliar de la configuración
    else if (hasPremiumAccess(session.user)) {
      hasPremiumRole = true;
      logAuth('Premium access detected via hasPremiumAccess function', session, {
        path,
        requestId,
        method: 'helper-function'
      });
    } 
    // Si la función auxiliar no detectó nada, seguir con otras estrategias
    else {
      // Estrategia 2: Namespace estándar para roles
      if (session.user[AUTH0_ROLES_NAMESPACE]) {
        roles = session.user[AUTH0_ROLES_NAMESPACE];
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
    const hasAccess = isAllowedUser || hasPremiumRole;
    
    // Log detallado de la decisión de acceso
    logAccess('Access verification', session.user, {
      isAllowedUser,
      hasPremiumRole,
      hasAccess,
      path
    }, { requestId });
    
    // En desarrollo, debug adicional
    if (process.env.NODE_ENV === 'development') {
      // Punto de depuración final para ver la decisión
      debugAuth0Session(session, 'middleware-decision', {
        isAllowedUser,
        hasPremiumRole,
        hasAccess,
        path
      });
    }

    // Si no tiene acceso premium pero intenta acceder a /chat, redirigir a unauthorized
    if (!hasAccess && path === '/chat') {
      logAuth('No premium access, redirecting to unauthorized', session, {
        path,
        requestId,
        redirectTo: '/unauthorized'
      });
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Si no tiene acceso premium pero intenta acceder a APIs del chat, devolver 403
    if (!hasAccess && path.startsWith('/api/chat')) {
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
      hasAccess
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