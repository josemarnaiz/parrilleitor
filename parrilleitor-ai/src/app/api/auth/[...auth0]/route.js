import { handleAuth, handleLogin } from '@auth0/nextjs-auth0'

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/',
    authorizationParams: {
      prompt: 'login',
      response_type: 'code',
      scope: 'openid profile email',
    },
  }),
  signup: handleLogin({
    returnTo: '/',
    authorizationParams: {
      prompt: 'signup',
      screen_hint: 'signup',
      response_type: 'code',
      scope: 'openid profile email',
    },
  }),
}) 