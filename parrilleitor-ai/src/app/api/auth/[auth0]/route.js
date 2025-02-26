import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0'

const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/'
  }),
  logout: handleLogout({
    returnTo: AUTH0_BASE_URL
  }),
  callback: handleCallback({
    afterCallback: async (req, res, session) => {
      return session
    }
  })
})

export const POST = handleAuth()

export const runtime = 'edge' 