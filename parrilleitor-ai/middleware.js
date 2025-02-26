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

export default withMiddlewareAuthRequired(async function middleware(req) {
  try {
    // No aplicar middleware a rutas públicas
    const path = req.nextUrl.pathname
    if (publicPaths.some(p => path.startsWith(p))) {
      return new Response(null, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'RSC': '1'
        }
      })
    }

    const res = new Response()
    const session = await getSession(req, res)
    
    const userEmail = session?.user?.email
    
    // Debug completo de la sesión
    console.log('Debug completo de sesión:', {
      email: userEmail,
      sessionExists: !!session,
      userExists: !!session?.user,
      allUserData: session?.user,
      allRolesData: session?.user?.[AUTH0_NAMESPACE]
    })

    // Verificar acceso por lista de permitidos
    const isAllowedUser = isInAllowedList(userEmail)
    console.log('Verificación de lista permitida:', {
      email: userEmail,
      isAllowed: isAllowedUser
    })

    // Verificar rol premium
    const roles = session?.user?.[AUTH0_NAMESPACE] || []
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)
    console.log('Verificación de rol premium:', {
      email: userEmail,
      roles,
      hasPremiumRole
    })

    // Decisión final de acceso
    const hasAccess = isAllowedUser || hasPremiumRole
    console.log('Decisión de acceso:', {
      email: userEmail,
      hasAccess,
      reason: isAllowedUser ? 'Lista permitida' : (hasPremiumRole ? 'Rol premium' : 'Sin acceso')
    })

    if (!hasAccess) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/unauthorized',
          'Cache-Control': 'no-store, max-age=0',
          'RSC': '1'
        },
      })
    }
    
    return res
  } catch (error) {
    console.error('Error en middleware:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    })
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/unauthorized',
        'Cache-Control': 'no-store, max-age=0',
        'RSC': '1'
      },
    })
  }
})

export const config = {
  matcher: [
    '/chat',
    '/api/chat',
    '/admin/:path*'
  ]
}

export const runtime = 'edge' 