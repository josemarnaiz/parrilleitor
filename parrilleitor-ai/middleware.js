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
  '/api/auth/me',
  '/unauthorized'
]

export default async function middleware(req) {
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
    
    // Log session state
    console.log('Middleware session check:', {
      path,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString()
    })

    // Si no hay sesión, permitir que la solicitud continúe en lugar de redirigir
    // Esto evita deslogeos automáticos
    if (!session?.user) {
      console.log('No session, but allowing request to continue:', {
        path,
        timestamp: new Date().toISOString()
      })
      return new Response(null, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    const userEmail = session.user.email
    
    // Verificar acceso
    const isAllowedUser = isInAllowedList(userEmail)
    const roles = session.user[AUTH0_NAMESPACE] || []
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)
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

    // Incluso si el usuario no tiene acceso premium, permitimos que continúe
    // en lugar de redirigir a unauthorized
    if (!hasAccess) {
      console.log('Access not verified, but allowing request to continue:', {
        email: userEmail,
        path,
        timestamp: new Date().toISOString()
      })
    }

    // Allow the request to proceed
    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
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
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}

export const config = {
  matcher: [
    '/chat',
    '/api/chat',
    '/admin/:path*'
  ]
}

export const runtime = 'edge' 