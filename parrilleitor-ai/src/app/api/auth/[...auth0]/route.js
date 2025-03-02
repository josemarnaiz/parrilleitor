import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0/edge'
import { getAuth0Config } from '@/config/auth0Config'

// Configuración común para Auth0
const config = getAuth0Config()

// Manejador personalizado para Auth0
export const GET = handleAuth({
  login: async (req) => {
    // Configurar el login para usar redirección directa
    return handleLogin(req, {
      authorizationParams: {
        // Forzar el uso de redirección directa
        response_mode: 'form_post',
        // Asegurarse de que se incluyan los scopes necesarios
        scope: 'openid profile email'
      },
      returnTo: '/'
    })
  },
  callback: async (req) => {
    // Manejar el callback con configuración personalizada
    return handleCallback(req)
  }
})

// También manejar solicitudes POST para el callback
export const POST = handleAuth()

export const runtime = 'edge' 