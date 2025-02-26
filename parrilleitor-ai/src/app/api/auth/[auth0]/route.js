import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0/edge'

const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'

// Configuración común de CORS y seguridad
const commonHeaders = {
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-next-router-state-tree, x-next-url',
  'Access-Control-Allow-Credentials': 'true',
  'Cache-Control': 'no-store, max-age=0',
}

// Función helper para manejar errores
async function handleAuthError(error, action) {
  console.error(`Error during ${action}:`, {
    message: error.message,
    stack: error.stack,
    type: error.constructor.name,
    action
  })
  
  return new Response(
    JSON.stringify({
      error: `Error during ${action}`,
      details: error.message,
      type: error.constructor.name
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...commonHeaders
      }
    }
  )
}

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/',
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE
    }
  }),
  callback: handleCallback({
    afterCallback: async (req, session) => {
      try {
        // Log session details
        console.log('Auth callback details:', {
          sessionExists: !!session,
          userEmail: session?.user?.email,
          accessToken: !!session?.accessToken,
          idToken: !!session?.idToken,
          timestamp: new Date().toISOString()
        })

        if (!session) {
          throw new Error('No session created during callback')
        }

        // Ensure session data is complete
        const enhancedSession = {
          ...session,
          user: {
            ...session.user,
            email: session.user.email,
            email_verified: session.user.email_verified,
            sub: session.user.sub,
            sessionStartTime: new Date().toISOString()
          },
          expiresIn: 24 * 60 * 60 // 24 hours in seconds
        }

        console.log('Enhanced session created:', {
          email: enhancedSession.user.email,
          sessionStartTime: enhancedSession.user.sessionStartTime,
          expiresIn: enhancedSession.expiresIn
        })

        return enhancedSession
      } catch (error) {
        console.error('Callback error:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        })
        throw error
      }
    }
  }),
  logout: handleLogout({
    returnTo: AUTH0_BASE_URL,
    // Asegurar que el logout es explícito
    onRedirecting: (req, res) => {
      console.log('Explicit logout requested:', {
        timestamp: new Date().toISOString(),
        url: req.url
      })
    }
  })
})

export const POST = handleAuth()

// Configure preflight requests
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      ...commonHeaders,
      'Access-Control-Max-Age': '86400',
    }
  })
}

export const runtime = 'edge' 