import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0/edge'
import { getAuth0Config } from '@/config/auth0Config'

// Configuración común para Auth0
const config = getAuth0Config()

// Constantes para roles
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const AUTH0_PERMISSIONS = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/permissions'

// Manejador personalizado para Auth0
export const GET = handleAuth({
  login: async (req) => {
    // Configurar el login para usar redirección directa
    console.log('Iniciando proceso de login con Auth0')
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
    console.log('Procesando callback de Auth0')
    return handleCallback(req, {
      // Asegurar que se procesen correctamente los tokens
      afterCallback: (_, session) => {
        console.log('Auth0 callback processed with session keys:', Object.keys(session));
        
        // Log del objeto de sesión para diagnóstico
        if (session && session.user) {
          console.log('Auth0 callback - User object:', JSON.stringify(session.user, null, 2));
          
          // Si los roles no están en el namespace estándar pero vienen en otro campo, 
          // los copiamos al namespace estándar
          if (!session.user[AUTH0_NAMESPACE] && session.user.roles) {
            session.user[AUTH0_NAMESPACE] = session.user.roles;
            console.log('Roles copiados de session.user.roles a namespace estándar');
          }
          
          // Si hay permissions pero no hay roles, buscar en permissions
          if (!session.user[AUTH0_NAMESPACE] && session.user[AUTH0_PERMISSIONS]) {
            session.user[AUTH0_NAMESPACE] = session.user[AUTH0_PERMISSIONS];
            console.log('Roles copiados de permissions a namespace estándar');
          }
          
          // Buscar en todas las propiedades para encontrar roles
          for (const key in session.user) {
            if (Array.isArray(session.user[key]) && key !== AUTH0_NAMESPACE) {
              console.log(`Encontrada propiedad array "${key}":`, session.user[key]);
              
              // Si parece contener roles, copiarlos al namespace estándar
              if (session.user[key].some(item => typeof item === 'string' && 
                  (item.startsWith('rol_') || item.toLowerCase().includes('premium')))) {
                session.user[AUTH0_NAMESPACE] = session.user[key];
                console.log(`Roles copiados de "${key}" a namespace estándar`);
                break;
              }
            }
          }
        }
        
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
    console.log('Procesando callback POST de Auth0')
    return handleCallback(req, {
      // Asegurar que se procesen correctamente los tokens
      afterCallback: (_, session) => {
        console.log('Auth0 callback (POST) processed with session keys:', Object.keys(session));
        
        // Log del objeto de sesión para diagnóstico
        if (session && session.user) {
          console.log('Auth0 callback (POST) - User object:', JSON.stringify(session.user, null, 2));
          
          // Si los roles no están en el namespace estándar pero vienen en otro campo, 
          // los copiamos al namespace estándar
          if (!session.user[AUTH0_NAMESPACE] && session.user.roles) {
            session.user[AUTH0_NAMESPACE] = session.user.roles;
            console.log('Roles copiados de session.user.roles a namespace estándar (POST)');
          }
          
          // Si hay permissions pero no hay roles, buscar en permissions
          if (!session.user[AUTH0_NAMESPACE] && session.user[AUTH0_PERMISSIONS]) {
            session.user[AUTH0_NAMESPACE] = session.user[AUTH0_PERMISSIONS];
            console.log('Roles copiados de permissions a namespace estándar (POST)');
          }
          
          // Buscar en todas las propiedades para encontrar roles
          for (const key in session.user) {
            if (Array.isArray(session.user[key]) && key !== AUTH0_NAMESPACE) {
              console.log(`Encontrada propiedad array "${key}" (POST):`, session.user[key]);
              
              // Si parece contener roles, copiarlos al namespace estándar
              if (session.user[key].some(item => typeof item === 'string' && 
                  (item.startsWith('rol_') || item.toLowerCase().includes('premium')))) {
                session.user[AUTH0_NAMESPACE] = session.user[key];
                console.log(`Roles copiados de "${key}" a namespace estándar (POST)`);
                break;
              }
            }
          }
        }
        
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