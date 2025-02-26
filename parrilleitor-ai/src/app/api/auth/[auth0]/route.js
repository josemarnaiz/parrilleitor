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
          idToken: !!session?.idToken
        })

        if (!session) {
          throw new Error('No session created during callback')
        }

        return {
          ...session,
          user: {
            ...session.user,
            // Ensure these fields are present
            email: session.user.email,
            email_verified: session.user.email_verified,
            sub: session.user.sub
          }
        }
      } catch (error) {
        console.error('Callback error:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        })
        throw error
      }
    }
  }),
  logout: handleLogout({
    returnTo: AUTH0_BASE_URL
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