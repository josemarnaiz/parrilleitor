import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0/edge'

const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'

// Configuración común de CORS y seguridad
const commonHeaders = {
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-next-router-state-tree, x-next-url',
  'Access-Control-Allow-Credentials': 'true',
  'Cache-Control': 'no-store, max-age=0',
  'RSC': '1',
}

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/',
    async afterLogin(req, res) {
      Object.entries(commonHeaders).forEach(([key, value]) => {
        res.headers.set(key, value)
      })
      return res
    }
  }),
  callback: handleCallback({
    async afterCallback(req, session, res) {
      Object.entries(commonHeaders).forEach(([key, value]) => {
        res.headers.set(key, value)
      })
      return session
    }
  }),
  logout: handleLogout({
    returnTo: AUTH0_BASE_URL,
    async afterLogout(req, res) {
      Object.entries(commonHeaders).forEach(([key, value]) => {
        res.headers.set(key, value)
      })
      return res
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