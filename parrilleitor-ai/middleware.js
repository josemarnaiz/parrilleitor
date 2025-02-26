import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'

// Actualizar el namespace para roles
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'

export default withMiddlewareAuthRequired(async function middleware(req) {
  try {
    const res = new Response()
    const session = await getSession(req, res)
    
    // Verificar si el usuario tiene el rol premium
    const roles = session?.user?.[AUTH0_NAMESPACE] || []
    console.log('Roles del usuario:', roles) // Para debugging
    
    if (!roles.includes('premium')) {
      console.log('Usuario no premium:', session?.user?.email) // Para debugging
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