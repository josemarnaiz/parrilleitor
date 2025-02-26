import { handleAuth, handleCallback } from '@auth0/nextjs-auth0'

export const GET = handleAuth({
  callback: handleCallback({
    afterCallback: async (req, res, session) => {
      return session
    }
  })
})

export const POST = handleAuth()

export const runtime = 'edge' 