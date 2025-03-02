import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0/edge'
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
        scope: 'openid profile email read:roles',
        // Especificar la audiencia para asegurar que se incluyan los roles
        audience: process.env.AUTH0_AUDIENCE || 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/api/v2/'
      },
      returnTo: '/'
    })
  },
  callback: async (req) => {
    // Manejar el callback con configuración personalizada
    return handleCallback(req, {
      // Asegurar que se procesen correctamente los tokens
      afterCallback: (_, session) => {
        console.log('Auth0 callback processed with session keys:', Object.keys(session));
        return session;
      }
    })
  },
  logout: async (req) => {
    // Configurar el logout para evitar problemas de CORS
    return handleLogout(req, {
      returnTo: config.logoutReturnTo
    })
  }
})

// También manejar solicitudes POST para el callback y logout
export const POST = handleAuth({
  callback: async (req) => {
    // Manejar el callback con configuración personalizada
    return handleCallback(req, {
      // Asegurar que se procesen correctamente los tokens
      afterCallback: (_, session) => {
        console.log('Auth0 callback (POST) processed with session keys:', Object.keys(session));
        return session;
      }
    })
  },
  logout: async (req) => {
    // Manejar el logout con POST para evitar problemas de CORS
    return handleLogout(req, {
      returnTo: config.logoutReturnTo
    })
  }
})

export const runtime = 'edge' 