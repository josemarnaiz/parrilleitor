import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired(async function middleware(req) {
  try {
    const res = new Response()
    const session = await getSession(req, res)
    console.log('Middleware session:', session)
    
    if (!session || !session.user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/api/auth/login',
        },
      })
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/api/auth/login',
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