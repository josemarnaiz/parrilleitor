// Configuración de Auth0 para la aplicación
export const auth0Config = {
  // Duración de la sesión en segundos (30 días)
  sessionDuration: 30 * 24 * 60 * 60,
  
  // Otras configuraciones de Auth0
  authorizationParams: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE
  },
  
  // URL de retorno después del login
  returnTo: '/',
  
  // URL de retorno después del logout
  logoutReturnTo: process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'
}

// Función para obtener la configuración de Auth0
export function getAuth0Config() {
  return auth0Config
} 