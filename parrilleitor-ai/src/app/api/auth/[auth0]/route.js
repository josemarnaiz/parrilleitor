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
    getLoginState() {
      return {
        returnTo: '/'
      }
    }
  }),
  callback: handleCallback({
    afterCallback: async (req, session) => {
      try {
        console.log('Auth callback:', {
          session: session ? 'exists' : 'null',
          user: session?.user?.email
        })
        return session
      } catch (error) {
        console.error('Error in callback:', error)
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