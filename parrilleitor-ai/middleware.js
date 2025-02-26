import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com'

export default withMiddlewareAuthRequired(async function middleware(req) {
  try {
    const res = new Response()
    const session = await getSession(req, res)
    
    // Verificar si el usuario tiene el rol premium
    const roles = session?.user?.[`${AUTH0_NAMESPACE}/roles`] || []
    
    if (!roles.includes('premium')) {
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