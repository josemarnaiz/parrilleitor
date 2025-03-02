import { handleAuth, handleCallback, handleLogin } from '@auth0/nextjs-auth0/edge'
import { getAuth0Config } from '@/config/auth0Config'

// Configuración común para Auth0
const config = getAuth0Config()

// Manejador personalizado para el login
export const GET = handleAuth({
  login: async (req) => {
    // Añadir cabeceras CORS a la respuesta de login
    return handleLogin(req, {
      authorizationParams: {
        ...config.authorizationParams,
        // Forzar el uso de form_post para evitar problemas de CORS
        response_mode: 'form_post'
      },
      returnTo: config.returnTo
    })
  },
  // Configuración personalizada para el callback
  callback: async (req) => {
    return handleCallback(req, {
      afterCallback: (req, res, session) => {
        // Asegurarse de que session siempre tenga una estructura correcta
        if (!session) return session;
        
        // Procesar y devolver la sesión
        return session;
      }
    })
  }
})

// También manejar solicitudes POST para el callback
export const POST = handleAuth()

export const runtime = 'edge' 