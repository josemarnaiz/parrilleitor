import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com'

export default withMiddlewareAuthRequired(async function middleware(req) {
  const res = new Response()
  const session = await getSession(req, res)

  // Log para debugging
  console.log('Session user:', session?.user)

  // Verifica si el usuario tiene el rol premium
  const roles = session?.user?.[`${AUTH0_NAMESPACE}/roles`] || []
  console.log('User roles:', roles)

  if (!roles.includes('premium')) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/unauthorized',
      },
    })
  }

  return res
})

// Configura en qué rutas se aplicará este middleware
export const config = {
  matcher: [
    '/chat',
    '/api/chat',
    '/api/chat/:path*'
  ]
} 