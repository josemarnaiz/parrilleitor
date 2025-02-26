import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from './src/config/allowedUsers'

// Actualizar el namespace para roles
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

export default withMiddlewareAuthRequired(async function middleware(req) {
  try {
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
      },
    })
  }
})

export const config = {
  matcher: [
    '/chat',
    '/api/chat'
  ]
}

export const runtime = 'edge' 