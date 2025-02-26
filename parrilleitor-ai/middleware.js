import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from './src/config/allowedUsers'

// Actualizar el namespace para roles
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

// Rutas que no requieren autenticación
const publicPaths = [
  '/',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/callback',
  '/unauthorized'
]

// Middleware function
async function authMiddleware(req) {
  try {
    // No aplicar middleware a rutas públicas
    const path = req.nextUrl.pathname
    if (publicPaths.some(p => path.startsWith(p))) {
      return new Response(null, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    // Get session
    const session = await getSession(req)
    
    // Si no hay sesión, redirigir a login
    if (!session?.user) {
      return Response.redirect(new URL('/api/auth/login', req.url))
    }

    const userEmail = session.user.email
    
    // Debug completo de la sesión
    console.log('Debug completo de sesión:', {
      email: userEmail,
      sessionExists: !!session,
      userExists: !!session?.user,
      allUserData: session?.user,
      allRolesData: session?.user?.[AUTH0_NAMESPACE]
    })

    // Verificar acceso
    const isAllowedUser = isInAllowedList(userEmail)
    const roles = session.user[AUTH0_NAMESPACE] || []
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)
    const hasAccess = isAllowedUser || hasPremiumRole

    // Log de verificación
    console.log('Verificación de acceso:', {
      email: userEmail,
      isAllowedUser,
      hasPremiumRole,
      hasAccess,
      path
    })

    if (!hasAccess) {
      return Response.redirect(new URL('/unauthorized', req.url))
    }

    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
    
  } catch (error) {
    console.error('Error en middleware:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    })
    return Response.redirect(new URL('/unauthorized', req.url))
  }
}

export default authMiddleware

export const config = {
  matcher: [
    '/chat',
    '/api/chat',
    '/admin/:path*'
  ]
}

export const runtime = 'edge' 