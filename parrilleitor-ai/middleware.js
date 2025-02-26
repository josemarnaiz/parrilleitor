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
    const roles = session?.user?.[AUTH0_NAMESPACE] || []
    
    console.log('Verificando acceso para:', userEmail) // Para debugging
    console.log('Roles del usuario:', roles) // Para debugging
    console.log('Session user data:', session?.user) // Debugging completo
    
    // Verificar si el usuario tiene acceso (por rol o por estar en la lista)
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)
    const isAllowedUser = isInAllowedList(userEmail)
    
    console.log('Estado de acceso:', {
      hasPremiumRole,
      isAllowedUser,
      email: userEmail
    })

    if (!hasPremiumRole && !isAllowedUser) {
      console.log('Usuario no autorizado:', userEmail)
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/unauthorized',
        },
      })
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
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