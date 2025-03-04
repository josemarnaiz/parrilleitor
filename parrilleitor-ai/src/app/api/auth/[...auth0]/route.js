import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0/edge'
import { getAuth0Config } from '@/config/auth0Config'

// Configuración común para Auth0
const config = getAuth0Config()

// Constantes para roles
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const AUTH0_PERMISSIONS = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/permissions'

// Función simple de log para Edge Runtime
const edgeLog = (type, message, data = {}) => {
  console.log(JSON.stringify({
    type,
    message,
    timestamp: new Date().toISOString(),
    data
  }));
};

// Manejador personalizado para Auth0
export const GET = handleAuth({
  login: async (req) => {
    // Configurar el login para usar redirección directa
    try {
      edgeLog('auth', 'Iniciando proceso de login con Auth0', {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries())
      });
      
      // Verificar si se solicita evitar redirección directa
      const url = new URL(req.url);
      const shouldUseRedirect = url.searchParams.get('directRedirect') !== 'false';
      
      return handleLogin(req, {
        authorizationParams: {
          // Configurar el modo de respuesta según parámetro
          response_mode: shouldUseRedirect ? 'form_post' : undefined,
          // Asegurarse de que se incluyan los scopes necesarios
          scope: 'openid profile email read:roles',
          // Especificar la audiencia para asegurar que se incluyan los roles
          audience: process.env.AUTH0_AUDIENCE || 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/api/v2/'
        },
        returnTo: '/',
        // URL para redirigir en caso de error
        // Esto asegura que los errores como el 4000 se manejen adecuadamente
        errorPath: '/auth/diagnostics'
      });
    } catch (error) {
      edgeLog('auth', 'Error en proceso de login Auth0', {
        url: req.url,
        method: req.method
      });
      
      // Redirigir a la página de diagnóstico en caso de error
      const baseUrl = new URL(req.url).origin;
      return Response.redirect(`${baseUrl}/auth/diagnostics?error=${error.code || 'unknown'}&error_description=${encodeURIComponent(error.message || 'Error desconocido')}`);
    }
  },
  callback: async (req) => {
    // Manejar el callback con configuración personalizada
    try {
      edgeLog('auth', 'Procesando callback de Auth0', {
        url: req.url,
        method: req.method
      });
      
      return handleCallback(req, {
        // Asegurar que se procesen correctamente los tokens
        afterCallback: (_, session) => {
          edgeLog('auth', 'Auth0 callback procesado', {
            sessionKeys: Object.keys(session) || []
          });
          
          // Log del objeto de sesión para diagnóstico
          if (session && session.user) {
            edgeLog('auth', 'Auth0 callback - datos de usuario', {
              userKeys: Object.keys(session.user) || []
            });
            
            // Si los roles no están en el namespace estándar pero vienen en otro campo, 
            // los copiamos al namespace estándar
            if (!session.user[AUTH0_NAMESPACE] && session.user.roles) {
              session.user[AUTH0_NAMESPACE] = session.user.roles;
              edgeLog('auth', 'Roles copiados de session.user.roles a namespace estándar', {
                roles: session.user.roles
              });
            }
            
            // Si hay permissions pero no hay roles, buscar en permissions
            if (!session.user[AUTH0_NAMESPACE] && session.user[AUTH0_PERMISSIONS]) {
              session.user[AUTH0_NAMESPACE] = session.user[AUTH0_PERMISSIONS];
              edgeLog('auth', 'Roles copiados de permissions a namespace estándar', {
                permissions: session.user[AUTH0_PERMISSIONS]
              });
            }
            
            // Buscar en todas las propiedades para encontrar roles
            for (const key in session.user) {
              if (Array.isArray(session.user[key]) && key !== AUTH0_NAMESPACE) {
                edgeLog('auth', `Encontrada propiedad array "${key}"`, {
                  arrayProperty: session.user[key]
                });
                
                // Si parece contener roles, copiarlos al namespace estándar
                if (session.user[key].some(item => typeof item === 'string' && 
                    (item.startsWith('rol_') || item.toLowerCase().includes('premium')))) {
                  session.user[AUTH0_NAMESPACE] = session.user[key];
                  edgeLog('auth', `Roles copiados de "${key}" a namespace estándar`, {
                    source: key,
                    roles: session.user[key]
                  });
                  break;
                }
              }
            }
          }
          
          return session;
        },
        redirectUri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
        // URL para redirigir en caso de error
        // Esto asegura que los errores como el 4000 se manejen adecuadamente
        errorPath: '/auth/diagnostics'
      });
    } catch (error) {
      edgeLog('auth', 'Error en callback de Auth0', {
        url: req.url,
        method: req.method
      });
      
      // Redirigir a la página de diagnóstico en caso de error
      const baseUrl = new URL(req.url).origin;
      return Response.redirect(`${baseUrl}/auth/diagnostics?error=${error.code || 'unknown'}&error_description=${encodeURIComponent(error.message || 'Error en callback')}`);
    }
  },
  logout: async (req) => {
    // Configurar el logout para evitar problemas de CORS
    try {
      edgeLog('auth', 'Iniciando proceso de logout con Auth0', {
        url: req.url,
        method: req.method
      });
      
      return handleLogout(req, {
        returnTo: config.logoutReturnTo
      });
    } catch (error) {
      edgeLog('auth', 'Error en proceso de logout Auth0', {
        url: req.url,
        method: req.method
      });
      
      // En caso de error de logout, redirigir al inicio
      const baseUrl = new URL(req.url).origin;
      return Response.redirect(baseUrl);
    }
  }
})

// También manejar solicitudes POST para el callback y logout
export const POST = handleAuth({
  callback: async (req) => {
    // Manejar el callback con configuración personalizada
    try {
      edgeLog('auth', 'Procesando callback POST de Auth0', {
        url: req.url,
        method: req.method
      });
      
      return handleCallback(req, {
        // Asegurar que se procesen correctamente los tokens
        afterCallback: (_, session) => {
          edgeLog('auth', 'Auth0 callback (POST) procesado', {
            sessionKeys: Object.keys(session) || []
          });
          
          // Log del objeto de sesión para diagnóstico
          if (session && session.user) {
            edgeLog('auth', 'Auth0 callback (POST) - datos de usuario', {
              userKeys: Object.keys(session.user) || []
            });
            
            // Misma lógica que en GET para procesar roles
            if (!session.user[AUTH0_NAMESPACE] && session.user.roles) {
              session.user[AUTH0_NAMESPACE] = session.user.roles;
              edgeLog('auth', 'Roles copiados de session.user.roles a namespace estándar (POST)', {
                roles: session.user.roles
              });
            }
            
            // Si hay permissions pero no hay roles, buscar en permissions
            if (!session.user[AUTH0_NAMESPACE] && session.user[AUTH0_PERMISSIONS]) {
              session.user[AUTH0_NAMESPACE] = session.user[AUTH0_PERMISSIONS];
              edgeLog('auth', 'Roles copiados de permissions a namespace estándar (POST)', {
                permissions: session.user[AUTH0_PERMISSIONS]
              });
            }
            
            // Buscar en todas las propiedades para encontrar roles
            for (const key in session.user) {
              if (Array.isArray(session.user[key]) && key !== AUTH0_NAMESPACE) {
                edgeLog('auth', `Encontrada propiedad array "${key}" (POST)`, {
                  arrayProperty: session.user[key]
                });
                
                // Si parece contener roles, copiarlos al namespace estándar
                if (session.user[key].some(item => typeof item === 'string' && 
                    (item.startsWith('rol_') || item.toLowerCase().includes('premium')))) {
                  session.user[AUTH0_NAMESPACE] = session.user[key];
                  edgeLog('auth', `Roles copiados de "${key}" a namespace estándar (POST)`, {
                    source: key,
                    roles: session.user[key]
                  });
                  break;
                }
              }
            }
          }
          
          return session;
        },
        redirectUri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
        // URL para redirigir en caso de error
        errorPath: '/auth/diagnostics'
      });
    } catch (error) {
      edgeLog('auth', 'Error en callback POST de Auth0', {
        url: req.url,
        method: req.method
      });
      
      // Redirigir a la página de diagnóstico en caso de error
      const baseUrl = new URL(req.url).origin;
      return Response.redirect(`${baseUrl}/auth/diagnostics?error=${error.code || 'unknown'}&error_description=${encodeURIComponent(error.message || 'Error en callback POST')}`);
    }
  },
  logout: async (req) => {
    // Manejar el logout con POST para evitar problemas de CORS
    try {
      edgeLog('auth', 'Procesando logout POST con Auth0', {
        url: req.url,
        method: req.method
      });
      
      return handleLogout(req, {
        returnTo: config.logoutReturnTo
      });
    } catch (error) {
      edgeLog('auth', 'Error en proceso de logout POST Auth0', {
        url: req.url,
        method: req.method
      });
      
      // En caso de error de logout, redirigir al inicio
      const baseUrl = new URL(req.url).origin;
      return Response.redirect(baseUrl);
    }
  }
})

export const runtime = 'edge' 