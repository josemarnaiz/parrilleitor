import { handleAuth, handleCallback } from '@auth0/nextjs-auth0/edge'

const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'

export const GET = handleAuth({
  callback: handleCallback({
    afterCallback: async (req, session) => {
      return session
    }
  })
})

export const POST = handleAuth()

export const runtime = 'edge'

// Configure CORS headers
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
} 