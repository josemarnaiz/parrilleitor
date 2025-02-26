import { handleAuth, handleCallback, handleLogout } from '@auth0/nextjs-auth0/edge'

const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'

// Configuración común de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

export const GET = handleAuth({
  callback: handleCallback({
    afterCallback: async (req, session) => {
      return session
    }
  }),
  logout: handleLogout({
    returnTo: AUTH0_BASE_URL,
    async afterLogout(req, res) {
      // Añadir headers CORS a la respuesta de logout
      Object.entries(corsHeaders).forEach(([key, value]) => {
        res.headers.set(key, value)
      })
      return res
    }
  })
})

export const POST = handleAuth()

export const runtime = 'edge'

// Configure CORS headers for preflight requests
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  })
} 