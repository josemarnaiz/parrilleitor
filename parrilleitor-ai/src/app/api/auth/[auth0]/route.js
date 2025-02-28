import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0/edge'
import { getAuth0Config } from '@/config/auth0Config'

const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'
const auth0Config = getAuth0Config()

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

// Configuración personalizada para Auth0
const authConfig = {
  login: handleLogin({
    returnTo: auth0Config.returnTo,
    authorizationParams: auth0Config.authorizationParams,
    // Aumentar el tiempo de expiración de la cookie
    cookieOptions: {
      maxAge: 60 * 24 * 60 * 60, // 60 días en segundos
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
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
          // Usar la duración de sesión de la configuración
          expiresIn: auth0Config.sessionDuration
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
    },
    // Aumentar el tiempo de expiración de la cookie
    cookieOptions: {
      maxAge: 60 * 24 * 60 * 60, // 60 días en segundos
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  }),
  logout: handleLogout({
    returnTo: auth0Config.logoutReturnTo,
    // Solo permitir logout explícito
    onRedirect: (req, res) => {
      // Verificar si el logout fue explícitamente solicitado
      const url = new URL(req.url)
      const isExplicitLogout = url.pathname === '/api/auth/logout'
      
      console.log('Logout request details:', {
        url: url.toString(),
        isExplicitLogout,
        timestamp: new Date().toISOString()
      })
      
      // Solo permitir logout si fue explícitamente solicitado
      if (isExplicitLogout) {
        return Response.redirect(new URL(auth0Config.logoutReturnTo, req.url))
      }
      
      // Si no fue explícito, redirigir a la página principal sin hacer logout
      return Response.redirect(new URL('/', req.url))
    }
  })
}

export const GET = handleAuth(authConfig)

export const POST = handleAuth(authConfig)

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